const list       = document.getElementById("historyList");
const emptyState = document.getElementById("emptyState");
const btnClear   = document.getElementById("btnClearMemory");
const btnExport  = document.getElementById("btnExportHistory");
const searchBox  = document.getElementById("searchBox");
const countChip  = document.getElementById("countChip");

let pairs = [];       // [{q:"...", a:"..."}]
let filtered = [];    // same shape for rendering

function htmlEscape(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function copyText(text) {
  navigator.clipboard?.writeText(text).then(() =>
    toast("Copied to clipboard")
  ).catch(() => alert("Copy failed"));
}

function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-3 py-2 rounded";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1200);
}

function pairMessages(messages) {
  const out = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if ((m.role || "").toLowerCase() === "human") {
      // find next ai message
      let sql = "";
      if (i + 1 < messages.length && (messages[i + 1].role || "").toLowerCase() === "ai") {
        sql = messages[i + 1].content || "";
        i += 1;
      }
      out.push({ q: m.content || "", a: sql || "" });
    }
  }
  return out;
}

function render(items) {
  list.innerHTML = "";
  if (!items.length) {
    emptyState.classList.remove("hidden");
    countChip.classList.add("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  countChip.textContent = `${items.length} entr${items.length === 1 ? "y" : "ies"}`;
  countChip.classList.remove("hidden");

  const cards = items.map((p, idx) => {
    const qSafe = htmlEscape(p.q);
    const aSafe = htmlEscape(p.a);
    return `
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm text-gray-500">#${idx + 1}</div>
          <div class="flex gap-2">
            <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    data-copy="${htmlEscape(p.q)}" data-kind="q">
              <i class="far fa-copy mr-1"></i>Copy Query
            </button>
            <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    data-copy="${htmlEscape(p.a)}" data-kind="a">
              <i class="far fa-copy mr-1"></i>Copy SQL
            </button>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <div class="text-xs font-semibold text-gray-600 mb-1">Query</div>
            <pre class="mono whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-3">${qSafe}</pre>
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-600 mb-1">Response (SQL)</div>
            <pre class="mono whitespace-pre-wrap code-dark rounded-lg p-3">${aSafe}</pre>
          </div>
        </div>
      </div>`;
  }).join("");

  list.innerHTML = cards;

  // Copy buttons
  list.querySelectorAll("button[data-copy]").forEach(btn => {
    btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy")));
  });
}

async function loadHistory() {
  list.innerHTML = `<div class="text-gray-500">Loading…</div>`;
  const res = await fetch("/api/history");
  const msgs = await res.json();
  pairs = pairMessages(msgs);
  filtered = pairs.slice();
  render(filtered);
}

btnClear?.addEventListener("click", async () => {
  if (!confirm("Clear chat memory for this session?")) return;
  await fetch("/api/memory/clear", { method: "POST" });
  await loadHistory();
  toast("History cleared");
});

btnExport?.addEventListener("click", () => {
  if (!filtered.length) return;
  const rows = [["Index","Query","SQL"]]
    .concat(filtered.map((p,i)=>[i+1, p.q.replaceAll('"','""'), p.a.replaceAll('"','""')]));
  const csv = rows.map(r => r.map(c => /[",\n]/.test(c) ? `"${c}"` : c).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "query_history.csv"; a.click();
  URL.revokeObjectURL(url);
});

searchBox?.addEventListener("input", (e) => {
  const q = (e.target.value || "").toLowerCase();
  filtered = !q ? pairs.slice()
    : pairs.filter(p => (p.q || "").toLowerCase().includes(q) || (p.a || "").toLowerCase().includes(q));
  render(filtered);
});

loadHistory();
