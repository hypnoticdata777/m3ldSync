export const EXPECTED_COLUMNS = [
  "Meld Number",
  "Unit",
  "Property Name",
  "Work Category",
  "Work Type",
  "Description",
  "Priority",
  "Meld Status",
  "Meld creation date",
  "Meld completion date",
  "Total Labor Hours"
];

export const CLOSED_STATUSES = new Set(["Completed", "Canceled by manager", "Canceled by tenant"]);

export const STATUS_ORDER = [
  "Pending meld assignment",
  "Pending vendor acceptance",
  "Pending more vendor availability",
  "Pending more management availability",
  "Pending completion",
  "Completed",
  "Canceled by manager",
  "Canceled by tenant"
];

export function createEmptyState() {
  return {
    records: {},
    history: [],
    imports: []
  };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export function parsePropertyMeldCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const headers = rows[0].map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim());
  const missingColumns = EXPECTED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    throw new Error(`CSV is missing required column(s): ${missingColumns.join(", ")}`);
  }

  return rows.slice(1).map((values, rowIndex) => {
    const source = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return normalizeImportRow(source, rowIndex + 2);
  });
}

export function normalizeImportRow(row, rowNumber = 0) {
  const id = clean(row["Meld Number"]);
  const sourceStatus = clean(row["Meld Status"]);

  if (!id) {
    throw new Error(`Row ${rowNumber} is missing Meld Number.`);
  }

  if (!sourceStatus) {
    throw new Error(`Row ${rowNumber} is missing Meld Status.`);
  }

  return {
    id,
    unit: clean(row.Unit),
    property: clean(row["Property Name"]),
    category: clean(row["Work Category"]),
    workType: clean(row["Work Type"]),
    description: clean(row.Description),
    priority: clean(row.Priority),
    sourceStatus,
    createdDate: parseMeldDate(row["Meld creation date"], `Row ${rowNumber} Meld creation date`),
    completedDate: row["Meld completion date"]
      ? parseMeldDate(row["Meld completion date"], `Row ${rowNumber} Meld completion date`)
      : null,
    totalLaborHours: Number.parseFloat(row["Total Labor Hours"] || "0") || 0
  };
}

export function reconcile(previousState, importRows, options = {}) {
  const uploadedAt = options.uploadedAt || new Date().toISOString();
  const batchId = options.batchId || `import-${uploadedAt}`;
  const filename = options.filename || "Imported CSV";
  const state = cloneState(previousState || createEmptyState());
  const seenIds = new Set();
  const summary = {
    newCount: 0,
    statusChangedCount: 0,
    staleCount: 0,
    unchangedCount: 0,
    discrepancyCount: 0,
    newIds: [],
    changedIds: [],
    staleIds: [],
    discrepancyIds: []
  };

  for (const row of importRows) {
    seenIds.add(row.id);
    const existing = state.records[row.id];

    if (!existing) {
      state.records[row.id] = {
        ...rowToRecord(row),
        firstSeenAt: uploadedAt,
        lastSeenAt: uploadedAt,
        stale: false,
        note: "",
        linkedRecordId: "",
        currentStatus: row.sourceStatus,
        importStatus: row.sourceStatus,
        statusSource: "import"
      };
      summary.newCount += 1;
      summary.newIds.push(row.id);
      state.history.push(historyEntry(row.id, uploadedAt, "", row.sourceStatus, "import", batchId, "Created from import"));
      continue;
    }

    const importedStatusChanged = existing.importStatus !== row.sourceStatus;
    const manualOverride = existing.statusSource === "manual";
    const nextRecord = {
      ...existing,
      ...rowToRecord(row),
      importStatus: row.sourceStatus,
      lastSeenAt: uploadedAt,
      stale: false
    };

    if (manualOverride) {
      if (importedStatusChanged) {
        summary.statusChangedCount += 1;
        summary.changedIds.push(row.id);
        state.history.push(
          historyEntry(
            row.id,
            uploadedAt,
            existing.importStatus,
            row.sourceStatus,
            "import",
            batchId,
            "Imported status changed; manual override retained"
          )
        );
      } else {
        summary.unchangedCount += 1;
      }

      if (row.sourceStatus !== existing.currentStatus) {
        summary.discrepancyCount += 1;
        summary.discrepancyIds.push(row.id);
      }

      state.records[row.id] = nextRecord;
      continue;
    }

    if (existing.currentStatus !== row.sourceStatus) {
      nextRecord.currentStatus = row.sourceStatus;
      nextRecord.statusSource = "import";
      summary.statusChangedCount += 1;
      summary.changedIds.push(row.id);
      state.history.push(
        historyEntry(row.id, uploadedAt, existing.currentStatus, row.sourceStatus, "import", batchId, "Status changed by import")
      );
    } else {
      summary.unchangedCount += 1;
    }

    state.records[row.id] = nextRecord;
  }

  for (const record of Object.values(state.records)) {
    if (!seenIds.has(record.id)) {
      if (!record.stale) {
        summary.staleCount += 1;
        summary.staleIds.push(record.id);
      }
      state.records[record.id] = { ...record, stale: true };
    }
  }

  const batch = {
    id: batchId,
    uploadedAt,
    filename,
    rowCount: importRows.length,
    ...summary
  };

  state.imports = [batch, ...state.imports];
  return { state, batch };
}

export function setManualStatus(previousState, recordId, nextStatus, timestamp = new Date().toISOString()) {
  const state = cloneState(previousState);
  const record = state.records[recordId];
  if (!record || record.currentStatus === nextStatus) {
    return state;
  }

  state.records[recordId] = {
    ...record,
    currentStatus: nextStatus,
    statusSource: "manual",
    manualStatus: nextStatus
  };
  state.history.push(historyEntry(recordId, timestamp, record.currentStatus, nextStatus, "manual", null, "Manual status override"));
  return state;
}

export function setRecordNote(previousState, recordId, note) {
  const state = cloneState(previousState);
  if (state.records[recordId]) {
    state.records[recordId] = { ...state.records[recordId], note };
  }
  return state;
}

export function setLinkedRecordDraft(previousState, recordId, linkedRecordId) {
  const state = cloneState(previousState);
  if (state.records[recordId]) {
    state.records[recordId] = { ...state.records[recordId], linkedRecordId: linkedRecordId.trim() };
  }
  return state;
}

export function setLinkedRecord(previousState, recordId, linkedRecordId) {
  const state = cloneState(previousState);
  const record = state.records[recordId];
  if (record) {
    const nextLinkedRecordId = linkedRecordId.trim();
    if ((record.linkedRecordId || "") === nextLinkedRecordId) {
      return state;
    }

    state.records[recordId] = { ...record, linkedRecordId: nextLinkedRecordId };
    state.history.push(
      historyEntry(
        recordId,
        new Date().toISOString(),
        record.linkedRecordId || "No linked record",
        nextLinkedRecordId || "No linked record",
        "manual",
        null,
        "Linked record updated"
      )
    );
  }
  return state;
}

export function isClosedStatus(status) {
  return CLOSED_STATUSES.has(status);
}

export function effectiveStatus(record, records) {
  if (isClosedStatus(record.currentStatus)) {
    return record.currentStatus;
  }

  const linkedRecord = record.linkedRecordId ? records[record.linkedRecordId] : null;
  if (linkedRecord && isClosedStatus(linkedRecord.currentStatus)) {
    return linkedRecord.currentStatus;
  }

  return record.currentStatus;
}

export function isEffectivelyClosed(record, records) {
  return isClosedStatus(effectiveStatus(record, records));
}

export function isLinkedResolved(record, records) {
  return !isClosedStatus(record.currentStatus) && isEffectivelyClosed(record, records);
}

export function daysOpen(record, now = new Date()) {
  const start = new Date(record.createdDate);
  const end = record.completedDate ? new Date(record.completedDate) : now;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
}

export function validateBackup(backup) {
  if (!isPlainObject(backup)) {
    throw new Error("Backup file is not a JSON object.");
  }

  if (!["demo", "private"].includes(backup.mode)) {
    throw new Error("Backup mode must be demo or private.");
  }

  if (!isPlainObject(backup.data)) {
    throw new Error("Backup is missing MeldSync data.");
  }

  if (!isPlainObject(backup.data.records)) {
    throw new Error("Backup records must be an object.");
  }

  if (!Array.isArray(backup.data.history)) {
    throw new Error("Backup history must be an array.");
  }

  if (!Array.isArray(backup.data.imports)) {
    throw new Error("Backup imports must be an array.");
  }

  Object.entries(backup.data.records).forEach(([recordId, record]) => validateBackupRecord(recordId, record));
  backup.data.history.forEach((entry, index) => validateBackupHistoryEntry(entry, index));
  backup.data.imports.forEach((batch, index) => validateBackupImportBatch(batch, index));

  if (backup.lastBatch) {
    validateBackupImportBatch(backup.lastBatch, "lastBatch");
  }
}

function clean(value) {
  return String(value ?? "").trim();
}

function parseMeldDate(value, label) {
  const cleaned = clean(value);
  if (!cleaned) {
    return null;
  }

  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`${label} has unsupported date format: ${cleaned}`);
  }

  const [, month, day, year, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid date: ${cleaned}`);
  }

  return date.toISOString();
}

function rowToRecord(row) {
  return {
    id: row.id,
    unit: row.unit,
    property: row.property,
    category: row.category,
    workType: row.workType,
    description: row.description,
    priority: row.priority,
    sourceStatus: row.sourceStatus,
    createdDate: row.createdDate,
    completedDate: row.completedDate,
    totalLaborHours: row.totalLaborHours
  };
}

function historyEntry(recordId, timestamp, fromStatus, toStatus, source, importBatchId, note) {
  const idParts = [recordId, timestamp, source, importBatchId || "manual", fromStatus || "none", toStatus || "none"]
    .join("|")
    .replace(/[^a-z0-9|:-]/gi, "-");

  return {
    id: idParts,
    recordId,
    timestamp,
    fromStatus,
    toStatus,
    source,
    importBatchId,
    note
  };
}

function validateBackupRecord(recordId, record) {
  if (!isPlainObject(record)) {
    throw new Error(`Backup record ${recordId} must be an object.`);
  }

  if (record.id !== recordId) {
    throw new Error(`Backup record ${recordId} has a mismatched id.`);
  }

  requireString(record.id, `Backup record ${recordId} id`);
  requireString(record.property, `Backup record ${recordId} property`);
  requireString(record.priority, `Backup record ${recordId} priority`);
  requireString(record.currentStatus, `Backup record ${recordId} current status`);
  requireString(record.importStatus, `Backup record ${recordId} import status`);
  requireString(record.statusSource, `Backup record ${recordId} status source`);
  requireString(record.createdDate, `Backup record ${recordId} created date`);
  requireString(record.firstSeenAt, `Backup record ${recordId} first seen`);
  requireString(record.lastSeenAt, `Backup record ${recordId} last seen`);

  if (!["import", "manual"].includes(record.statusSource)) {
    throw new Error(`Backup record ${recordId} status source must be import or manual.`);
  }

  if (typeof record.stale !== "boolean") {
    throw new Error(`Backup record ${recordId} stale flag must be boolean.`);
  }

  if (!Number.isFinite(record.totalLaborHours)) {
    throw new Error(`Backup record ${recordId} labor hours must be a number.`);
  }
}

function validateBackupHistoryEntry(entry, index) {
  if (!isPlainObject(entry)) {
    throw new Error(`Backup history entry ${index} must be an object.`);
  }

  requireString(entry.id, `Backup history entry ${index} id`);
  requireString(entry.recordId, `Backup history entry ${index} record id`);
  requireString(entry.timestamp, `Backup history entry ${index} timestamp`);
  requireString(entry.toStatus, `Backup history entry ${index} destination status`);
  requireString(entry.source, `Backup history entry ${index} source`);
  requireString(entry.note, `Backup history entry ${index} note`);

  if (!["import", "manual"].includes(entry.source)) {
    throw new Error(`Backup history entry ${index} source must be import or manual.`);
  }
}

function validateBackupImportBatch(batch, index) {
  if (!isPlainObject(batch)) {
    throw new Error(`Backup import batch ${index} must be an object.`);
  }

  requireString(batch.id, `Backup import batch ${index} id`);
  requireString(batch.uploadedAt, `Backup import batch ${index} uploaded timestamp`);
  requireString(batch.filename, `Backup import batch ${index} filename`);

  ["rowCount", "newCount", "statusChangedCount", "staleCount", "unchangedCount", "discrepancyCount"].forEach((field) => {
    if (!Number.isFinite(batch[field])) {
      throw new Error(`Backup import batch ${index} ${field} must be a number.`);
    }
  });

  ["newIds", "changedIds", "staleIds", "discrepancyIds"].forEach((field) => {
    if (!Array.isArray(batch[field]) || batch[field].some((id) => typeof id !== "string")) {
      throw new Error(`Backup import batch ${index} ${field} must be a string array.`);
    }
  });
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneState(state) {
  return {
    records: { ...(state?.records || {}) },
    history: [...(state?.history || [])],
    imports: [...(state?.imports || [])]
  };
}
