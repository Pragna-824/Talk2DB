// ===== DOM Elements =====
const databaseSelect   = document.getElementById("databaseSelect");
const tableSelect      = document.getElementById("tableSelect");
const queryInput       = document.getElementById("queryInput");
const submitButton     = document.getElementById("submitQuery");
const clearButton      = document.getElementById("btnClear");
const resultsContainer = document.getElementById("resultsContainer");
const sqlContainer     = document.getElementById("sqlContainer");
const generatedSQL     = document.getElementById("generatedSQL");
const btnExport        = document.getElementById("btnExport");

// Header buttons
const btnHistory  = document.getElementById("btnHistory");
const btnSettings = document.getElementById("btnSettings");
const btnRole     = document.getElementById("btnRole");
const roleLabel   = document.getElementById("roleLabel");
const adminBanner = document.getElementById("adminBanner");

let currentResults = [];
let currentColumns = [];

// ===== Helpers =====
function setLoading(message = "Processing your query...") {
  resultsContainer.innerHTML = `
    <div class="loading-row">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span class="ml-3 text-gray-600">${message}</span>
    </div>`;
}

function setEmptyState() {
  resultsContainer.innerHTML = `
    <div class="flex flex-col items-center justify-center h-40 text-gray-400">
      <i class="fas fa-inbox text-4xl mb-4"></i>
      <p class="text-lg">No results</p>
    </div>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toCSV(columns, rows) {
  if (!columns?.length || !rows?.length) return "";
  const header = columns.join(",");
  const body = rows.map(r =>
      columns.map(c => {
        const v = r[c] ?? "";
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
  return `${header}\n${body}`;
}

function enableExport(enabled) {
  btnExport.disabled = !enabled;
  btnExport.classList.toggle("disabled", !enabled);
}

// ===== Renderers =====
function renderTable(columns, rows) {
  if (!columns?.length || !rows?.length) {
    setEmptyState();
    enableExport(false);
    return;
  }

  const headerCells = columns.map(h => `
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      ${escapeHtml(h)}
    </th>`).join("");

  const bodyRows = rows.map((row, idx) => `
    <tr class="${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100">
      ${columns.map(c => `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${escapeHtml(row[c])}
        </td>`).join("")}
    </tr>`).join("");

  resultsContainer.innerHTML = `
    <div class="table-scroll">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50"><tr>${headerCells}</tr></thead>
        <tbody class="bg-white divide-y divide-gray-200">${bodyRows}</tbody>
      </table>
    </div>
    <div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
      <p class="text-sm text-gray-600">Showing ${rows.length} results</p>
    </div>`;
  enableExport(true);
}

// ===== Role Helpers =====
async function getRole() {
  const res = await fetch("/api/role");
  if (!res.ok) return { role: "viewer" };
  return res.json();
}
async function becomeAdmin(passcode) {
  const res = await fetch("/api/auth/admin", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function becomeViewer() {
  const res = await fetch("/api/auth/viewer", { method: "POST" });
  if (!res.ok) throw new Error("Failed to switch role");
  return res.json();
}
function reflectRole(role) {
  if (roleLabel) roleLabel.textContent = role === "admin" ? "Admin" : "Viewer";
  if (adminBanner) {
    if (role === "admin") adminBanner.classList.remove("hidden");
    else adminBanner.classList.add("hidden");
  }
}

// ===== API Calls =====
async function fetchDatabases() {
  const res = await fetch("/api/databases");
  if (!res.ok) throw new Error("Failed to load databases");
  return res.json();
}
async function fetchTables(database) {
  const res = await fetch(`/api/tables?database=${encodeURIComponent(database)}`);
  if (!res.ok) throw new Error("Failed to load tables");
  return res.json();
}
async function runQuery({ database, table, query }) {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ database, table, query })
  });
  if (!res.ok) throw new Error(await res.text() || "Query failed");
  return res.json();
}

// ===== Events =====
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const dbs = await fetchDatabases();
    dbs.forEach(db => {
      const opt = document.createElement("option");
      opt.value = db.id || db.name;
      opt.textContent = db.name || db.id;
      databaseSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    alert("Could not load databases. Please check your backend.");
  }

  // reflect role
  try {
    const { role } = await getRole();
    reflectRole(role);
  } catch (_) {}

  if (btnHistory) btnHistory.addEventListener("click", () => (window.location.href = "/history"));
  if (btnSettings) btnSettings.addEventListener("click", () => alert("Settings coming soon!"));

  if (btnRole) {
    btnRole.addEventListener("click", async () => {
      const { role } = await getRole();
      if (role === "admin") {
        await becomeViewer();
        reflectRole("viewer");
        alert("Switched to Viewer (read-only).");
      } else {
        const pass = prompt("Enter admin passcode:");
        if (!pass) return;
        try {
          await becomeAdmin(pass);
          reflectRole("admin");
          alert("Admin mode enabled.");
        } catch (e) {
          alert(e.message || "Invalid passcode");
        }
      }
    });
  }
});

databaseSelect.addEventListener("change", async function () {
  const selectedDb = this.value;
  tableSelect.innerHTML = '<option value="">Choose a table...</option>';
  if (!selectedDb) return;
  try {
    const tables = await fetchTables(selectedDb);
    tables.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tableSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    alert("Could not load tables. Please check your backend.");
  }
});

submitButton.addEventListener("click", async () => {
  const query = queryInput.value.trim();
  const database = databaseSelect.value;
  const table = tableSelect.value;

  if (!query) return alert("Please enter a query in natural language");
  if (!database || !table) return alert("Please select both a database and a table");

  setLoading();

  try {
    const result = await runQuery({ database, table, query });
    generatedSQL.textContent = result.sql || "";
    sqlContainer.classList.remove("hidden");

    currentColumns = Array.isArray(result.columns)
      ? result.columns
      : Object.keys(result.rows?.[0] || {});
    currentResults = Array.isArray(result.rows) ? result.rows : [];

    renderTable(currentColumns, currentResults);
  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = `
      <div class="p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-start">
          <i class="fas fa-exclamation-triangle mt-1 mr-3"></i>
          <div>
            <p class="font-semibold">Query failed</p>
            <p class="text-sm">${escapeHtml(err.message || "Unknown error")}</p>
          </div>
        </div>
      </div>`;
    enableExport(false);
  }
});

clearButton.addEventListener("click", () => (queryInput.value = ""));

btnExport?.addEventListener("click", () => {
  if (!currentColumns.length || !currentResults.length) return;
  const csv = toCSV(currentColumns, currentResults);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "results.csv";
  a.click();
  URL.revokeObjectURL(url);
});
