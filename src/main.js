import {
  STATUS_ORDER,
  createEmptyState,
  daysOpen,
  effectiveStatus,
  isEffectivelyClosed,
  isLinkedResolved,
  parsePropertyMeldCsv,
  reconcile,
  setLinkedRecord,
  setManualStatus,
  setRecordNote
} from "./domain.js";
import { demoBaselineCsv, demoFollowUpCsv } from "./demoData.js";
import { runDemoQa } from "./qa.js";
import { clearState, loadState, saveState } from "./storage.js";

const app = document.querySelector("#app");
const now = new Date("2026-07-15T12:00:00");

let model = loadState() || createDemoModel();
let selectedRecordId = Object.keys(model.data.records)[0] || "";
let pendingImport = null;
let filters = {
  search: "",
  property: "All",
  priority: "All",
  hideClosed: true
};

render();

function createDemoModel() {
  const rows = parsePropertyMeldCsv(demoBaselineCsv);
  const { state, batch } = reconcile(createEmptyState(), rows, {
    uploadedAt: "2026-07-10T12:00:00.000Z",
    batchId: "demo-baseline",
    filename: "demo-baseline.csv"
  });

  return {
    mode: "demo",
    data: state,
    lastBatch: batch
  };
}

function setModel(nextModel) {
  model = nextModel;
  saveState(model);
  if (selectedRecordId && !model.data.records[selectedRecordId]) {
    selectedRecordId = Object.keys(model.data.records)[0] || "";
  }
  render();
}

function render() {
  const records = filteredRecords();
  const selectedRecord = model.data.records[selectedRecordId] || records[0] || null;
  selectedRecordId = selectedRecord?.id || "";
  const modeState = modeBadgeState();

  app.innerHTML = `
    <header class="app-header">
      <div>
        <p class="eyebrow">MeldSync</p>
        <h1>Recurring Work Order Reconciliation</h1>
      </div>
      <div class="mode-pill ${modeState.className}">
        ${modeState.label}
      </div>
    </header>

    <main class="workspace">
      <section class="toolbar" aria-label="Import and filters">
        <div class="button-row">
          <button id="demoBaseline">Load Demo Baseline</button>
          <button id="demoFollowUp">Run Demo Follow-Up Import</button>
          <label class="file-button">
            Import CSV
            <input id="csvInput" type="file" accept=".csv,text/csv" />
          </label>
          <button class="ghost" id="exportBackup">Export Backup</button>
          <label class="file-button ghost-file">
            Restore Backup
            <input id="restoreInput" type="file" accept=".json,application/json" />
          </label>
          <button class="ghost" id="resetData">Reset Local Data</button>
        </div>
        <div class="filter-row">
          <input id="search" type="search" value="${escapeAttr(filters.search)}" placeholder="Search ID, property, unit, description" />
          <select id="propertyFilter">${propertyOptions()}</select>
          <select id="priorityFilter">${priorityOptions()}</select>
          <label class="toggle">
            <input id="hideClosed" type="checkbox" ${filters.hideClosed ? "checked" : ""} />
            Hide closed
          </label>
        </div>
      </section>

      <section class="metrics" aria-label="Reconciliation summary">
        ${summaryMetric("Records", Object.keys(model.data.records).length)}
        ${summaryMetric("Open", allRecords().filter((record) => !isEffectivelyClosed(record, model.data.records)).length)}
        ${summaryMetric("Stale", allRecords().filter((record) => record.stale).length)}
        ${summaryMetric("Manual", allRecords().filter((record) => record.statusSource === "manual").length)}
        ${summaryMetric("Linked resolved", allRecords().filter((record) => isLinkedResolved(record, model.data.records)).length)}
        ${batchSummary()}
      </section>

      ${pendingImport ? renderImportPreview() : ""}

      ${renderImportLedger()}

      ${renderQaPanel()}

      <section class="main-grid">
        <aside class="property-panel" aria-label="Property overview">
          <div class="section-title">
            <h2>Properties</h2>
            <span>${propertyStats().length}</span>
          </div>
          <div class="property-list">
            ${propertyStats().map(renderPropertyRow).join("")}
          </div>
        </aside>

        <section class="board" aria-label="Kanban board">
          ${renderBoard(records)}
        </section>

        <aside class="detail-panel" aria-label="Record details">
          ${selectedRecord ? renderDetail(selectedRecord) : emptyDetail()}
        </aside>
      </section>
    </main>
  `;

  bindEvents();
}

function modeBadgeState() {
  if (pendingImport?.mode === "private") {
    return {
      className: "private",
      label: "Private Import Preview"
    };
  }

  if (pendingImport?.mode === "demo") {
    return {
      className: "demo",
      label: "Demo Import Preview"
    };
  }

  if (model.mode === "private") {
    return {
      className: "private",
      label: "Private Local Data"
    };
  }

  return {
    className: "demo",
    label: "Demo Data"
  };
}

function bindEvents() {
  document.querySelector("#demoBaseline").addEventListener("click", () => {
    selectedRecordId = "";
    setModel(createDemoModel());
  });

  document.querySelector("#demoFollowUp").addEventListener("click", () => {
    const base = model.mode === "demo" ? model.data : createDemoModel().data;
    const rows = parsePropertyMeldCsv(demoFollowUpCsv);
    const { state, batch } = reconcile(base, rows, {
      uploadedAt: "2026-07-11T12:00:00.000Z",
      batchId: `demo-follow-up-${Date.now()}`,
      filename: "demo-follow-up.csv"
    });
    pendingImport = {
      mode: "demo",
      state,
      batch,
      filename: "demo-follow-up.csv",
      note: "Synthetic follow-up import. Safe for public demo."
    };
    render();
  });

  document.querySelector("#resetData").addEventListener("click", () => {
    if (confirm("Reset local MeldSync data and reload the synthetic demo baseline?")) {
      pendingImport = null;
      clearState();
      selectedRecordId = "";
      setModel(createDemoModel());
    }
  });

  document.querySelector("#csvInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parsePropertyMeldCsv(text);
      const startingState = model.mode === "private" ? model.data : createEmptyState();
      const { state, batch } = reconcile(startingState, rows, {
        uploadedAt: new Date().toISOString(),
        batchId: `private-${Date.now()}`,
        filename: file.name
      });
      pendingImport = {
        mode: "private",
        state,
        batch,
        filename: file.name,
        note: "This import will be stored only in this browser on this machine."
      };
      render();
    } catch (error) {
      alert(error.message);
    } finally {
      event.target.value = "";
    }
  });

  document.querySelector("#exportBackup").addEventListener("click", () => {
    exportBackup();
  });

  document.querySelector("#restoreInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());
      validateBackup(backup);
      if (confirm("Restore this MeldSync backup into local browser storage? Current local state will be replaced.")) {
        pendingImport = null;
        selectedRecordId = "";
        setModel(backup);
      }
    } catch (error) {
      alert(`Backup restore failed: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  });

  document.querySelector("#commitImport")?.addEventListener("click", () => {
    if (!pendingImport) return;
    selectedRecordId = Object.keys(pendingImport.state.records)[0] || "";
    const nextModel = {
      mode: pendingImport.mode,
      data: pendingImport.state,
      lastBatch: pendingImport.batch
    };
    pendingImport = null;
    setModel(nextModel);
  });

  document.querySelector("#cancelImport")?.addEventListener("click", () => {
    pendingImport = null;
    render();
  });

  document.querySelector("#search").addEventListener("input", (event) => {
    filters.search = event.target.value;
    render();
  });

  document.querySelector("#propertyFilter").addEventListener("change", (event) => {
    filters.property = event.target.value;
    render();
  });

  document.querySelector("#priorityFilter").addEventListener("change", (event) => {
    filters.priority = event.target.value;
    render();
  });

  document.querySelector("#hideClosed").addEventListener("change", (event) => {
    filters.hideClosed = event.target.checked;
    render();
  });

  document.querySelectorAll("[data-record-id]").forEach((element) => {
    element.addEventListener("click", () => {
      selectedRecordId = element.dataset.recordId;
      render();
    });
  });

  document.querySelectorAll("[data-property]").forEach((element) => {
    element.addEventListener("click", () => {
      filters.property = element.dataset.property;
      render();
    });
  });

  const statusSelect = document.querySelector("#manualStatus");
  if (statusSelect) {
    statusSelect.addEventListener("change", (event) => {
      const state = setManualStatus(model.data, selectedRecordId, event.target.value);
      setModel({ ...model, data: state });
    });
  }

  const noteInput = document.querySelector("#noteInput");
  if (noteInput) {
    noteInput.addEventListener("input", (event) => {
      model = { ...model, data: setRecordNote(model.data, selectedRecordId, event.target.value) };
      saveState(model);
    });
  }

  const linkInput = document.querySelector("#linkInput");
  if (linkInput) {
    linkInput.addEventListener("change", (event) => {
      const state = setLinkedRecord(model.data, selectedRecordId, event.target.value);
      setModel({ ...model, data: state });
    });
  }
}

function renderImportPreview() {
  const batch = pendingImport.batch;
  const totalAfterImport = Object.keys(pendingImport.state.records).length;
  return `
    <section class="import-preview" aria-label="Import preview">
      <div>
        <p class="eyebrow">Import Preview</p>
        <h2>${escapeHtml(pendingImport.filename)}</h2>
        <p>${escapeHtml(pendingImport.note)}</p>
      </div>
      <div class="preview-stats">
        ${summaryMetric("Rows", batch.rowCount)}
        ${summaryMetric("New", batch.newCount)}
        ${summaryMetric("Changed", batch.statusChangedCount)}
        ${summaryMetric("Stale", batch.staleCount)}
        ${summaryMetric("Manual conflicts", batch.discrepancyCount)}
        ${summaryMetric("Total after", totalAfterImport)}
      </div>
      <div class="preview-details">
        ${previewList("New", batch.newIds, pendingImport.state.records)}
        ${previewList("Changed", batch.changedIds, pendingImport.state.records)}
        ${previewList("Stale", batch.staleIds, pendingImport.state.records)}
        ${previewList("Manual conflicts", batch.discrepancyIds, pendingImport.state.records)}
      </div>
      <div class="button-row">
        <button id="commitImport">Commit Import</button>
        <button class="ghost" id="cancelImport">Cancel</button>
      </div>
    </section>
  `;
}

function allRecords() {
  return Object.values(model.data.records);
}

function filteredRecords() {
  const query = filters.search.trim().toLowerCase();
  return allRecords().filter((record) => {
    const searchable = [record.id, record.property, record.unit, record.description, record.category, record.workType]
      .join(" ")
      .toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (filters.property === "All" || record.property === filters.property) &&
      (filters.priority === "All" || record.priority === filters.priority) &&
      (!filters.hideClosed || !isEffectivelyClosed(record, model.data.records))
    );
  });
}

function renderBoard(records) {
  const statuses = [...new Set(records.map((record) => effectiveStatus(record, model.data.records)))].sort(
    (a, b) => statusIndex(a) - statusIndex(b)
  );

  if (statuses.length === 0) {
    return `<div class="empty-state">No records match the current filters.</div>`;
  }

  return statuses
    .map((status) => {
      const columnRecords = records.filter((record) => effectiveStatus(record, model.data.records) === status);
      return `
        <article class="column">
          <div class="column-header ${statusClass(status)}">
            <h2>${escapeHtml(status)}</h2>
            <span>${columnRecords.length}</span>
          </div>
          <div class="card-stack">
            ${columnRecords.map(renderCard).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCard(record) {
  const selected = record.id === selectedRecordId ? "selected" : "";
  const linkedResolved = isLinkedResolved(record, model.data.records);
  return `
    <button class="work-card ${selected}" data-record-id="${escapeAttr(record.id)}">
      <div class="card-topline">
        <strong>${escapeHtml(record.id)}</strong>
        <span class="priority ${priorityClass(record.priority)}">${escapeHtml(record.priority)}</span>
      </div>
      <div class="property-name">${escapeHtml(record.property)}${record.unit ? ` - ${escapeHtml(record.unit)}` : ""}</div>
      <p>${escapeHtml(record.description)}</p>
      <div class="card-meta">
        <span>${escapeHtml(record.category)}</span>
        <span>${daysOpen(record, now)}d</span>
        ${record.stale ? `<span class="stale">Stale</span>` : ""}
        ${record.statusSource === "manual" ? `<span class="manual">Manual</span>` : ""}
        ${linkedResolved ? `<span class="linked-resolved">Linked resolved</span>` : ""}
      </div>
    </button>
  `;
}

function renderDetail(record) {
  const relatedHistory = model.data.history.filter((entry) => entry.recordId === record.id).slice().reverse();
  const linkedRecord = record.linkedRecordId ? model.data.records[record.linkedRecordId] : null;
  return `
    <div class="section-title">
      <h2>${escapeHtml(record.id)}</h2>
      <span class="${record.statusSource === "manual" ? "manual-source" : "import-source"}">${record.statusSource}</span>
    </div>
    <div class="detail-block">
      <label>Status</label>
      <select id="manualStatus">
        ${statusOptions(record.currentStatus)}
      </select>
    </div>
    <div class="detail-grid">
      ${detailItem("Property", record.property)}
      ${detailItem("Unit", record.unit || "Unassigned")}
      ${detailItem("Priority", record.priority)}
      ${detailItem("Age", `${daysOpen(record, now)} days`)}
      ${detailItem("Import status", record.importStatus)}
      ${detailItem("Effective status", effectiveStatus(record, model.data.records))}
      ${detailItem("Last seen", formatDate(record.lastSeenAt))}
    </div>
    <div class="detail-block">
      <label>Note</label>
      <textarea id="noteInput" rows="5">${escapeHtml(record.note || "")}</textarea>
    </div>
    <div class="detail-block">
      <label>Linked record</label>
      <input id="linkInput" value="${escapeAttr(record.linkedRecordId || "")}" placeholder="Meld Number" />
      ${linkedRecord ? renderLinkedRecordSummary(linkedRecord) : `<p class="muted">No linked record found in current data.</p>`}
    </div>
    <div class="detail-block">
      <label>Description</label>
      <p class="description">${escapeHtml(record.description)}</p>
    </div>
    <div class="history">
      <h3>History</h3>
      ${relatedHistory.map(renderHistoryEntry).join("") || `<p class="muted">No history yet.</p>`}
    </div>
  `;
}

function renderLinkedRecordSummary(linkedRecord) {
  return `
    <div class="linked-summary">
      <strong>${escapeHtml(linkedRecord.id)}</strong>
      <span>${escapeHtml(linkedRecord.currentStatus)}</span>
      <p>${escapeHtml(linkedRecord.property)}${linkedRecord.unit ? ` - ${escapeHtml(linkedRecord.unit)}` : ""}</p>
    </div>
  `;
}

function renderHistoryEntry(entry) {
  return `
    <div class="history-entry">
      <strong>${escapeHtml(entry.source)}</strong>
      <span>${formatDate(entry.timestamp)}</span>
      <p>${escapeHtml(entry.fromStatus || "New")} -> ${escapeHtml(entry.toStatus)}${entry.note ? ` - ${escapeHtml(entry.note)}` : ""}</p>
    </div>
  `;
}

function propertyStats() {
  const stats = new Map();
  for (const record of allRecords()) {
    const current = stats.get(record.property) || {
      property: record.property,
      open: 0,
      closed: 0,
      stale: 0,
      oldestOpen: 0
    };
    if (isEffectivelyClosed(record, model.data.records)) {
      current.closed += 1;
    } else {
      current.open += 1;
      current.oldestOpen = Math.max(current.oldestOpen, daysOpen(record, now));
    }
    if (record.stale) {
      current.stale += 1;
    }
    stats.set(record.property, current);
  }

  return [...stats.values()].sort((a, b) => b.open - a.open || b.oldestOpen - a.oldestOpen);
}

function renderPropertyRow(stat) {
  const active = filters.property === stat.property ? "active" : "";
  return `
    <button class="property-row ${active}" data-property="${escapeAttr(stat.property)}">
      <span>${escapeHtml(stat.property)}</span>
      <strong>${stat.open}</strong>
      <small>${stat.oldestOpen}d oldest - ${stat.stale} stale</small>
    </button>
  `;
}

function summaryMetric(label, value) {
  return `
    <div class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function batchSummary() {
  const batch = model.lastBatch || model.data.imports[0];
  if (!batch) {
    return summaryMetric("Latest import", "None");
  }

  return `
    <div class="metric wide">
      <span>Latest import</span>
      <strong>${batch.newCount} new - ${batch.statusChangedCount} changed - ${batch.staleCount} stale</strong>
    </div>
  `;
}

function renderImportLedger() {
  const imports = model.data.imports.slice(0, 5);
  if (!imports.length) {
    return "";
  }

  return `
    <section class="import-ledger" aria-label="Import batch history">
      <div class="section-title">
        <h2>Import History</h2>
        <span>${model.data.imports.length}</span>
      </div>
      <div class="import-ledger-list">
        ${imports.map(renderImportBatch).join("")}
      </div>
    </section>
  `;
}

function renderImportBatch(batch) {
  return `
    <article>
      <strong>${escapeHtml(batch.filename)}</strong>
      <span>${formatDate(batch.uploadedAt)}</span>
      <p>${batch.rowCount} rows - ${batch.newCount} new - ${batch.statusChangedCount} changed - ${batch.staleCount} stale</p>
    </article>
  `;
}

function renderQaPanel() {
  const report = runDemoQa();
  const allPassed = report.passed === report.total;
  return `
    <section class="qa-panel" aria-label="Demo QA status">
      <div class="section-title">
        <h2>Demo QA</h2>
        <span class="${allPassed ? "qa-pass" : "qa-fail"}">${report.passed}/${report.total}</span>
      </div>
      <div class="qa-grid">
        ${report.checks.map(renderQaCheck).join("")}
      </div>
    </section>
  `;
}

function renderQaCheck(item) {
  return `
    <div class="qa-check ${item.passed ? "passed" : "failed"}">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </div>
  `;
}

function propertyOptions() {
  const properties = ["All", ...new Set(allRecords().map((record) => record.property).sort())];
  return properties
    .map((property) => `<option value="${escapeAttr(property)}" ${filters.property === property ? "selected" : ""}>${escapeHtml(property)}</option>`)
    .join("");
}

function priorityOptions() {
  const priorities = ["All", ...new Set(allRecords().map((record) => record.priority).sort())];
  return priorities
    .map((priority) => `<option value="${escapeAttr(priority)}" ${filters.priority === priority ? "selected" : ""}>${escapeHtml(priority)}</option>`)
    .join("");
}

function statusOptions(currentStatus) {
  const statuses = [...new Set([...STATUS_ORDER, ...allRecords().map((record) => record.currentStatus)])];
  return statuses
    .map((status) => `<option value="${escapeAttr(status)}" ${status === currentStatus ? "selected" : ""}>${escapeHtml(status)}</option>`)
    .join("");
}

function detailItem(label, value) {
  return `
    <div>
      <span>${label}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function emptyDetail() {
  return `<div class="empty-state">Select a record.</div>`;
}

function previewList(label, ids = [], records = {}) {
  if (!ids.length) {
    return `
      <div>
        <strong>${label}</strong>
        <span>None</span>
      </div>
    `;
  }

  const visible = ids
    .slice(0, 5)
    .map((id) => {
      const record = records[id];
      return record ? `${id} (${record.property}, ${effectiveStatus(record, records)})` : id;
    })
    .join("; ");
  const extra = ids.length > 5 ? ` +${ids.length - 5} more` : "";
  return `
    <div>
      <strong>${label}</strong>
      <span>${escapeHtml(visible)}${extra}</span>
    </div>
  `;
}

function exportBackup() {
  const backup = {
    ...model,
    exportedAt: new Date().toISOString(),
    product: "MeldSync POC",
    version: 1
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `meldsync-backup-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function validateBackup(backup) {
  if (!backup || typeof backup !== "object") {
    throw new Error("Backup file is not a JSON object.");
  }

  if (!["demo", "private"].includes(backup.mode)) {
    throw new Error("Backup mode must be demo or private.");
  }

  if (!backup.data || typeof backup.data.records !== "object" || !Array.isArray(backup.data.history)) {
    throw new Error("Backup is missing MeldSync data.");
  }
}

function statusIndex(status) {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? 999 : index;
}

function statusClass(status) {
  if (status === "Completed") return "status-completed";
  if (status.startsWith("Canceled")) return "status-canceled";
  if (status.includes("vendor")) return "status-vendor";
  if (status.includes("management")) return "status-management";
  if (status.includes("completion")) return "status-completion";
  return "status-assignment";
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase().replace(/[^a-z]/g, "")}`;
}

function formatDate(value) {
  if (!value) return "None";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(value)
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
