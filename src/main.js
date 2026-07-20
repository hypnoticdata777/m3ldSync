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
  setLinkedRecordDraft,
  setManualStatus,
  setRecordNote
} from "./domain.js";
import { demoBaselineCsv, demoFollowUpCsv } from "./demoData.js";
import { getDemoWalkthrough, runDemoQa } from "./qa.js";
import { clearState, loadAccessMode, loadState, saveAccessMode, saveState } from "./storage.js";

const app = document.querySelector("#app");
const now = new Date("2026-07-15T12:00:00");

let accessMode = loadAccessMode();
let model = accessMode === "owner" ? loadState() || createDemoModel() : createDemoModel();
let selectedRecordId = Object.keys(model.data.records)[0] || "";
let pendingImport = null;
let resetConfirmOpen = false;
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

function createFollowUpModel() {
  const base = createDemoModel().data;
  const rows = parsePropertyMeldCsv(demoFollowUpCsv);
  const { state, batch } = reconcile(base, rows, {
    uploadedAt: "2026-07-11T12:00:00.000Z",
    batchId: "demo-follow-up-proof",
    filename: "demo-follow-up.csv"
  });

  return {
    mode: "demo",
    data: state,
    lastBatch: batch
  };
}

function createStickyManualProofModel() {
  const baseline = createDemoModel().data;
  const manuallyCorrected = setManualStatus(baseline, "MS-1001", "Completed", "2026-07-10T13:00:00.000Z");
  const rows = parsePropertyMeldCsv(demoFollowUpCsv);
  const { state, batch } = reconcile(manuallyCorrected, rows, {
    uploadedAt: "2026-07-11T12:00:00.000Z",
    batchId: "demo-sticky-manual-proof",
    filename: "demo-follow-up.csv"
  });
  selectedRecordId = "MS-1001";

  return {
    mode: "demo",
    data: state,
    lastBatch: batch
  };
}

function createLinkedResolutionProofModel() {
  const followUp = createFollowUpModel();
  const linkedState = setLinkedRecord(followUp.data, "MS-1001", "MS-1002", "2026-07-11T13:00:00.000Z");
  selectedRecordId = "MS-1001";

  return {
    ...followUp,
    data: linkedState
  };
}

function setModel(nextModel) {
  model = nextModel;
  persistModel();
  if (selectedRecordId && !model.data.records[selectedRecordId]) {
    selectedRecordId = Object.keys(model.data.records)[0] || "";
  }
  render();
}

function persistModel() {
  if (accessMode === "owner") {
    saveState(model);
  }
}

function switchAccessMode(nextAccessMode) {
  accessMode = nextAccessMode;
  saveAccessMode(accessMode);
  pendingImport = null;
  resetConfirmOpen = false;
  selectedRecordId = "";
  model = accessMode === "owner" ? loadState() || createDemoModel() : createDemoModel();
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
      <div class="header-actions">
        <div class="access-switch" aria-label="Access mode">
          <button id="publicAccess" class="${accessMode === "public" ? "active" : ""}">Public Demo</button>
          <button id="ownerAccess" class="${accessMode === "owner" ? "active" : ""}">Owner</button>
        </div>
        <div class="mode-pill ${modeState.className}">
          ${modeState.label}
        </div>
      </div>
    </header>

    <main class="workspace">
      <section class="toolbar" aria-label="Import and filters">
        <div class="button-row">
          <button id="demoBaseline">Load Demo Baseline</button>
          <button id="demoFollowUp">Run Demo Follow-Up Import</button>
          ${accessMode === "owner" ? renderOwnerControls() : ""}
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

      ${renderAccessNotice()}

      <section class="metrics" aria-label="Reconciliation summary">
        ${summaryMetric("Records", Object.keys(model.data.records).length)}
        ${summaryMetric("Open", allRecords().filter((record) => !isEffectivelyClosed(record, model.data.records)).length)}
        ${summaryMetric("Stale", allRecords().filter((record) => record.stale).length)}
        ${summaryMetric("Manual", allRecords().filter((record) => record.statusSource === "manual").length)}
        ${summaryMetric("Linked resolved", allRecords().filter((record) => isLinkedResolved(record, model.data.records)).length)}
        ${batchSummary()}
      </section>

      ${accessMode === "public" ? renderPublicSnapshot() : ""}

      ${accessMode === "public" ? renderOperationalBrief() : ""}

      ${accessMode === "public" ? renderProofActions() : ""}

      ${renderAgingRiskPanel()}

      ${accessMode === "public" ? renderPublicProofPack() : ""}

      ${pendingImport ? renderImportPreview() : ""}

      ${resetConfirmOpen ? renderResetConfirmation() : ""}

      ${renderImportLedger()}

      ${accessMode === "owner" ? renderQaPanel() : ""}

      ${renderWalkthroughPanel()}

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
  if (accessMode === "public") {
    return {
      className: "demo",
      label: pendingImport ? "Demo Import Preview" : "Public Demo"
    };
  }

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

function renderAccessNotice() {
  if (accessMode === "public") {
    return `
      <section class="access-notice public" aria-label="Public demo data notice">
        <strong>Synthetic demo workspace</strong>
        <span>No real properties, units, descriptions, CSV uploads, backups, or owner storage are shown in Public Demo.</span>
      </section>
    `;
  }

  return `
    <section class="access-notice owner" aria-label="Owner workspace data notice">
      <strong>Local owner workspace</strong>
      <span>CSV imports and backup restores stay in this browser on this machine unless you export a backup file.</span>
    </section>
  `;
}

function bindEvents() {
  document.querySelector("#publicAccess").addEventListener("click", () => {
    if (accessMode !== "public") {
      switchAccessMode("public");
    }
  });

  document.querySelector("#ownerAccess").addEventListener("click", () => {
    if (accessMode !== "owner") {
      switchAccessMode("owner");
    }
  });

  document.querySelector("#demoBaseline").addEventListener("click", () => {
    pendingImport = null;
    resetConfirmOpen = false;
    selectedRecordId = "";
    setModel(createDemoModel());
  });

  document.querySelector("#demoFollowUp").addEventListener("click", () => {
    resetConfirmOpen = false;
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

  document.querySelector("#stickyProof")?.addEventListener("click", () => {
    pendingImport = null;
    resetConfirmOpen = false;
    setModel(createStickyManualProofModel());
  });

  document.querySelector("#linkedProof")?.addEventListener("click", () => {
    pendingImport = null;
    resetConfirmOpen = false;
    setModel(createLinkedResolutionProofModel());
  });

  document.querySelector("#resetData")?.addEventListener("click", () => {
    pendingImport = null;
    resetConfirmOpen = true;
    render();
  });

  document.querySelector("#csvInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      resetConfirmOpen = false;
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

  document.querySelector("#exportBackup")?.addEventListener("click", () => {
    exportBackup();
  });

  document.querySelector("#restoreInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      resetConfirmOpen = false;
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
    resetConfirmOpen = false;
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
    resetConfirmOpen = false;
    render();
  });

  document.querySelector("#confirmReset")?.addEventListener("click", () => {
    pendingImport = null;
    resetConfirmOpen = false;
    clearState();
    selectedRecordId = "";
    setModel(createDemoModel());
  });

  document.querySelector("#cancelReset")?.addEventListener("click", () => {
    resetConfirmOpen = false;
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
      persistModel();
    });
  }

  const linkInput = document.querySelector("#linkInput");
  if (linkInput) {
    linkInput.addEventListener("input", (event) => {
      model = { ...model, data: setLinkedRecordDraft(model.data, selectedRecordId, event.target.value) };
      persistModel();
    });

    linkInput.addEventListener("change", (event) => {
      const state = setLinkedRecord(model.data, selectedRecordId, event.target.value);
      setModel({ ...model, data: state });
    });
  }
}

function renderOwnerControls() {
  return `
    <span class="owner-divider"></span>
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
  `;
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

function renderResetConfirmation() {
  return `
    <section class="reset-confirmation" aria-label="Reset confirmation">
      <div>
        <p class="eyebrow">Confirm Reset</p>
        <h2>Reset owner workspace?</h2>
        <p>This clears local owner data in this browser and reloads the synthetic demo baseline.</p>
      </div>
      <div class="button-row">
        <button id="confirmReset">Confirm Reset</button>
        <button class="ghost" id="cancelReset">Keep Current Data</button>
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

function renderPublicSnapshot() {
  const records = allRecords();
  const properties = propertyStats();
  const openRecords = records.filter((record) => !isEffectivelyClosed(record, model.data.records));
  const staleRecords = records.filter((record) => record.stale);
  const batch = model.lastBatch || model.data.imports[0];
  const latestImport = batch
    ? `${batch.newCount} new / ${batch.statusChangedCount} changed / ${batch.staleCount} stale`
    : "No import yet";

  return `
    <section class="public-snapshot" aria-label="Public demo snapshot">
      <div class="section-title">
        <h2>Public Demo Snapshot</h2>
        <span>Synthetic</span>
      </div>
      <div class="snapshot-grid">
        ${snapshotItem("Portfolio", `${properties.length} properties`, `${records.length} synthetic records`)}
        ${snapshotItem("Open Work", `${openRecords.length} active`, `${staleRecords.length} stale records`)}
        ${snapshotItem("Latest Import", latestImport, batch ? batch.filename : "Synthetic baseline")}
        ${snapshotItem("Private Surface", "Hidden", "Owner tools stay out of Public Demo")}
      </div>
    </section>
  `;
}

function renderOperationalBrief() {
  const briefState = pendingImport?.mode === "demo" ? pendingImport.state : model.data;
  const records = Object.values(briefState.records);
  const staleRecords = records.filter((record) => record.stale);
  const manualRecords = records.filter((record) => record.statusSource === "manual");
  const linkedResolvedRecords = records.filter((record) => isLinkedResolved(record, briefState.records));
  const oldestProperty = propertyStatsFor(records, briefState.records)[0];
  const batch = pendingImport?.mode === "demo" ? pendingImport.batch : model.lastBatch || model.data.imports[0];
  const importSignal = batch
    ? `${batch.newCount} new, ${batch.statusChangedCount} changed, ${batch.staleCount} stale`
    : "No import signal yet";

  return `
    <section class="operational-brief" aria-label="Operational brief">
      <div class="section-title">
        <h2>Operational Brief</h2>
        <span>Public proof</span>
      </div>
      <div class="brief-grid">
        ${briefItem("Import Signal", importSignal, batch ? batch.filename : "Synthetic baseline")}
        ${briefItem(
          "Triage Focus",
          oldestProperty ? oldestProperty.property : "No property selected",
          oldestProperty ? `${oldestProperty.open} open / ${oldestProperty.oldestOpen}d oldest` : "No active work"
        )}
        ${briefItem("Verification Queue", `${staleRecords.length} stale`, "Absent records are flagged, not deleted")}
        ${briefItem(
          "Human Corrections",
          `${manualRecords.length} manual / ${linkedResolvedRecords.length} linked`,
          "Manual and linked resolution stay durable"
        )}
      </div>
    </section>
  `;
}

function renderProofActions() {
  const selectedRecord = model.data.records[selectedRecordId];
  const selectedSummary = selectedRecord
    ? `${selectedRecord.id} - ${effectiveStatus(selectedRecord, model.data.records)}`
    : "No record selected";

  return `
    <section class="proof-actions" aria-label="Public proof controls">
      <div>
        <p class="eyebrow">Proof Controls</p>
        <h2>Manual truth stays durable</h2>
      </div>
      <div class="button-row">
        <button id="stickyProof">Sticky Manual Proof</button>
        <button id="linkedProof" class="ghost">Linked Resolution Proof</button>
      </div>
      <div class="proof-status">
        <span>Selected proof record</span>
        <strong>${escapeHtml(selectedSummary)}</strong>
      </div>
    </section>
  `;
}

function renderAgingRiskPanel() {
  const riskState = pendingImport?.mode === "demo" ? pendingImport.state : model.data;
  const stats = riskStats(Object.values(riskState.records), riskState.records).slice(0, 4);
  if (!stats.length) {
    return "";
  }

  return `
    <section class="aging-risk" aria-label="Aging risk panel">
      <div class="section-title">
        <h2>Aging Risk</h2>
        <span>${stats.length} focus areas</span>
      </div>
      <div class="risk-grid">
        ${stats.map(renderRiskItem).join("")}
      </div>
    </section>
  `;
}

function riskStats(records = allRecords(), recordMap = model.data.records) {
  const stats = new Map();
  for (const record of records) {
    const current = stats.get(record.property) || {
      property: record.property,
      open: 0,
      stale: 0,
      highPriority: 0,
      oldestOpen: 0
    };
    if (!isEffectivelyClosed(record, recordMap)) {
      current.open += 1;
      current.oldestOpen = Math.max(current.oldestOpen, daysOpen(record, now));
      if (["Emergency", "High"].includes(record.priority)) {
        current.highPriority += 1;
      }
    }
    if (record.stale) {
      current.stale += 1;
    }
    stats.set(record.property, current);
  }

  return [...stats.values()]
    .filter((item) => item.open > 0 || item.stale > 0)
    .map((item) => ({
      ...item,
      score: item.oldestOpen + item.open * 3 + item.highPriority * 5 + item.stale * 4
    }))
    .sort((a, b) => b.score - a.score || b.oldestOpen - a.oldestOpen || b.open - a.open);
}

function renderRiskItem(item) {
  const level = item.highPriority > 0 || item.oldestOpen >= 14 ? "Elevated" : item.stale > 0 ? "Watch" : "Normal";
  return `
    <article class="risk-item ${riskClass(level)}">
      <div>
        <span>${escapeHtml(level)}</span>
        <strong>${escapeHtml(item.property)}</strong>
      </div>
      <p>${item.open} open / ${item.oldestOpen}d oldest</p>
      <small>${item.highPriority} high priority / ${item.stale} stale</small>
    </article>
  `;
}

function riskClass(level) {
  return `risk-${level.toLowerCase()}`;
}

function renderPublicProofPack() {
  const proofState = pendingImport?.mode === "demo" ? pendingImport.state : model.data;
  const records = Object.values(proofState.records);
  const batch = pendingImport?.mode === "demo" ? pendingImport.batch : model.lastBatch || proofState.imports[0];
  const topRisk = riskStats(records, proofState.records)[0];
  const staleCount = records.filter((record) => record.stale).length;
  const manualCount = records.filter((record) => record.statusSource === "manual").length;
  const linkedResolvedCount = records.filter((record) => isLinkedResolved(record, proofState.records)).length;
  const importSignal = batch
    ? `${batch.newCount} new / ${batch.statusChangedCount} changed / ${batch.staleCount} stale`
    : "Baseline loaded";

  return `
    <section class="proof-pack" aria-label="Public demo proof pack">
      <div class="section-title">
        <h2>Demo Proof Pack</h2>
        <span>Public-ready</span>
      </div>
      <div class="proof-pack-grid">
        ${proofPackItem("Reconciliation", importSignal, batch ? batch.filename : "Synthetic baseline")}
        ${proofPackItem("Verification", `${staleCount} stale`, "Absent records remain visible")}
        ${proofPackItem("Manual Memory", `${manualCount} sticky`, "Human corrections survive imports")}
        ${proofPackItem("Linked Resolution", `${linkedResolvedCount} resolved`, "Follow-up tickets close originals")}
        ${proofPackItem(
          "Top Focus",
          topRisk ? topRisk.property : "No active risk",
          topRisk ? `${topRisk.open} open / ${topRisk.oldestOpen}d oldest` : "All records resolved"
        )}
        ${proofPackItem("Data Boundary", "Synthetic only", "Owner tools and private files hidden")}
      </div>
    </section>
  `;
}

function propertyStatsFor(records, recordMap) {
  const stats = new Map();
  for (const record of records) {
    const current = stats.get(record.property) || {
      property: record.property,
      open: 0,
      oldestOpen: 0
    };
    if (!isEffectivelyClosed(record, recordMap)) {
      current.open += 1;
      current.oldestOpen = Math.max(current.oldestOpen, daysOpen(record, now));
    }
    stats.set(record.property, current);
  }

  return [...stats.values()].sort((a, b) => b.open - a.open || b.oldestOpen - a.oldestOpen);
}

function briefItem(label, value, detail) {
  return `
    <article class="brief-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function proofPackItem(label, value, detail) {
  return `
    <article class="proof-pack-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function snapshotItem(label, value, detail) {
  return `
    <article class="snapshot-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
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

function renderWalkthroughPanel() {
  const report = runDemoQa();
  const steps = getDemoWalkthrough(report).filter((step) => accessMode === "owner" || step.action !== "Export Backup");
  return `
    <section class="walkthrough-panel" aria-label="Demo walkthrough">
      <div class="section-title">
        <h2>Demo Walkthrough</h2>
        <span>${steps.filter((step) => step.passed).length}/${steps.length}</span>
      </div>
      <div class="walkthrough-grid">
        ${steps.map(renderWalkthroughStep).join("")}
      </div>
    </section>
  `;
}

function renderWalkthroughStep(step) {
  return `
    <article class="walkthrough-step ${step.passed ? "passed" : "failed"}">
      <div class="step-topline">
        <strong>${step.number}. ${escapeHtml(step.title)}</strong>
        <span>${step.passed ? "Ready" : "Check"}</span>
      </div>
      <p><b>Action:</b> ${escapeHtml(step.action)}</p>
      <p><b>Expected:</b> ${escapeHtml(step.expected)}</p>
      <small>${escapeHtml(step.detail)}</small>
    </article>
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
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `meldsync-backup-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
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
