export const ADMIN_PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Admin · Bonheur Multiservices</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Inter", sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #f8fafc;
    color: #0f172a;
    padding: 32px 24px 64px;
  }
  .wrap { max-width: 1200px; margin: 0 auto; }
  header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; }
  h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
  .sub { margin: 2px 0 0; font-size: 13px; color: #64748b; }
  .meta { font-size: 12px; color: #94a3b8; }
  .section-title {
    font-size: 13px; font-weight: 600; color: #374151;
    margin: 0 0 10px; display: flex; align-items: center; gap: 8px;
  }
  .section-title .count {
    background: #e2e8f0; color: #64748b; border-radius: 999px;
    padding: 1px 8px; font-size: 11px; font-weight: 600;
  }
  .section { margin-bottom: 40px; }
  .card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    box-shadow: 0 1px 2px rgba(0,0,0,.04); overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 11px 14px; vertical-align: middle; }
  thead th {
    font-size: 11px; text-transform: uppercase; letter-spacing: .08em;
    color: #94a3b8; font-weight: 600; background: #f8fafc;
    border-bottom: 1px solid #e2e8f0; white-space: nowrap;
  }
  tbody tr + tr td { border-top: 1px solid #f1f5f9; }
  tbody tr:hover td { background: #fafafa; }
  td.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; color: #334155; }
  td.amount { font-weight: 600; color: #0f172a; }
  td.date { font-size: 12px; color: #64748b; white-space: nowrap; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; }
  button {
    font: inherit; cursor: pointer; border: 1px solid transparent;
    padding: 5px 11px; border-radius: 8px; font-size: 13px; font-weight: 500;
    transition: opacity .15s;
  }
  button:disabled { opacity: .5; cursor: not-allowed; }
  .btn-confirm { background: #10b981; color: #fff; border-color: #059669; }
  .btn-confirm:hover:not(:disabled) { background: #059669; }
  .btn-cancel { background: #fff; color: #b91c1c; border-color: #fecaca; }
  .btn-cancel:hover:not(:disabled) { background: #fef2f2; }
  .empty { padding: 40px 24px; text-align: center; color: #94a3b8; font-size: 14px; }
  /* Status pills */
  .pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 500;
    white-space: nowrap;
  }
  .pill-dot { width: 5px; height: 5px; border-radius: 50%; }
  .pill-pending  { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .pill-pending .pill-dot  { background: #f59e0b; }
  .pill-confirmed { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
  .pill-confirmed .pill-dot { background: #10b981; }
  .pill-cancelled { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .pill-cancelled .pill-dot { background: #f87171; }
  /* Toolbar */
  .toolbar { display: flex; align-items: center; gap: 8px; }
  .refresh {
    background: #fff; color: #0f172a; border: 1px solid #e2e8f0;
    padding: 6px 12px; border-radius: 8px; font-size: 13px; cursor: pointer;
  }
  .refresh:hover { background: #f8fafc; }
  .logout {
    background: #fff; color: #b91c1c; border: 1px solid #fecaca;
    padding: 6px 12px; border-radius: 8px; font-size: 13px; cursor: pointer;
    text-decoration: none; display: inline-block;
  }
  .logout:hover { background: #fef2f2; }
  /* History search */
  .history-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .history-toolbar input {
    flex: 1; max-width: 300px; padding: 7px 12px; border: 1px solid #e2e8f0;
    border-radius: 8px; font: inherit; font-size: 13px; background: #fff; color: #0f172a;
    outline: none;
  }
  .history-toolbar input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.12); }
  .history-toolbar select {
    padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 8px;
    font: inherit; font-size: 13px; background: #fff; color: #0f172a; outline: none; cursor: pointer;
  }
  .history-toolbar select:focus { border-color: #10b981; }
</style>
</head>
<body>
<div class="wrap">

  <!-- Header -->
  <header>
    <div>
      <h1>Administration</h1>
      <p class="sub">Bonheur Multiservices · 1xBet</p>
    </div>
    <div class="toolbar">
      <span class="meta" id="meta-pending">—</span>
      <button class="refresh" id="refresh">Rafraîchir</button>
      <a class="logout" href="/admin/change-password">Mot de passe</a>
      <a class="logout" href="/admin/logout">Déconnexion</a>
    </div>
  </header>

  <!-- Pending transactions -->
  <div class="section">
    <p class="section-title">
      🕐 Transactions en attente
      <span class="count" id="pending-count">0</span>
    </p>
    <div class="card">
      <div id="pending-content">
        <div class="empty">Chargement…</div>
      </div>
    </div>
  </div>

  <!-- History -->
  <div class="section">
    <p class="section-title">
      📋 Historique des transactions
      <span class="count" id="history-count">0</span>
    </p>
    <div class="history-toolbar">
      <input type="text" id="history-search" placeholder="Rechercher par client, ID 1xBet, opérateur…" />
      <select id="history-filter">
        <option value="all">Tous les statuts</option>
        <option value="confirmed">Confirmé</option>
        <option value="cancelled">Annulé</option>
        <option value="pending">En attente</option>
      </select>
    </div>
    <div class="card">
      <div id="history-content">
        <div class="empty">Chargement…</div>
      </div>
    </div>
  </div>

</div>

<script>
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

function statusPill(status) {
  const labels = { pending: "En attente", confirmed: "Confirmé", cancelled: "Annulé" };
  const cls = { pending: "pill-pending", confirmed: "pill-confirmed", cancelled: "pill-cancelled" };
  const label = labels[status] ?? status;
  const c = cls[status] ?? "pill-pending";
  return \`<span class="pill \${c}"><span class="pill-dot"></span>\${label}</span>\`;
}

/* ── Pending section ── */
async function loadPending() {
  const content = document.getElementById("pending-content");
  const count = document.getElementById("pending-count");
  const meta = document.getElementById("meta-pending");
  try {
    const res = await fetch("/api/admin/transactions?status=pending", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const rows = data.transactions || [];
    count.textContent = rows.length;
    meta.textContent = rows.length + " en attente";

    if (rows.length === 0) {
      content.innerHTML = '<div class="empty">Aucune transaction en attente.</div>';
      return;
    }

    const body = rows.map((r) => \`
      <tr data-id="\${r.id}">
        <td class="mono">\${escapeHtml(r.clientPhone)}</td>
        <td>\${escapeHtml(r.type ?? "—")}</td>
        <td class="amount">\${escapeHtml(r.amount)} FCFA</td>
        <td class="mono">\${escapeHtml(r.oneXBetId)}</td>
        <td>\${escapeHtml(r.operator)}</td>
        <td class="mono">\${escapeHtml(r.operatorPhone)}</td>
        <td class="date">\${fmtDate(r.createdAt)}</td>
        <td>
          <div class="actions">
            <button class="btn-confirm" data-action="confirm" data-id="\${r.id}">Confirmer</button>
            <button class="btn-cancel"  data-action="cancel"  data-id="\${r.id}">Annuler</button>
          </div>
        </td>
      </tr>
    \`).join("");

    content.innerHTML = \`
      <table>
        <thead>
          <tr>
            <th>Client</th><th>Type</th><th>Montant</th><th>ID 1xBet</th>
            <th>Opérateur</th><th>N° opérateur</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>\${body}</tbody>
      </table>
    \`;
  } catch (err) {
    content.innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>';
  }
}

async function act(id, action, btn) {
  const row = btn.closest("tr");
  const buttons = row.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));
  try {
    const res = await fetch("/api/admin/transactions/" + id + "/" + action, { method: "POST" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    row.style.transition = "opacity .2s";
    row.style.opacity = "0";
    setTimeout(() => { loadPending(); loadHistory(); }, 220);
  } catch (err) {
    alert("Erreur : " + err.message);
    buttons.forEach((b) => (b.disabled = false));
  }
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t instanceof HTMLElement && t.dataset.action && t.dataset.id) {
    act(t.dataset.id, t.dataset.action, t);
  }
});

/* ── History section ── */
let allHistory = [];

async function loadHistory() {
  const content = document.getElementById("history-content");
  const count = document.getElementById("history-count");
  try {
    const res = await fetch("/api/admin/transactions?status=all", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    allHistory = data.transactions || [];
    count.textContent = allHistory.length;
    renderHistory();
  } catch (err) {
    content.innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>';
  }
}

function renderHistory() {
  const content = document.getElementById("history-content");
  const search = document.getElementById("history-search").value.trim().toLowerCase();
  const filter = document.getElementById("history-filter").value;

  let rows = allHistory;

  if (filter !== "all") {
    rows = rows.filter((r) => r.status === filter);
  }
  if (search) {
    rows = rows.filter((r) =>
      [r.clientPhone, r.oneXBetId, r.operator, r.operatorPhone, r.amount, r.type]
        .some((v) => String(v ?? "").toLowerCase().includes(search))
    );
  }

  document.getElementById("history-count").textContent = rows.length;

  if (rows.length === 0) {
    content.innerHTML = '<div class="empty">Aucune transaction trouvée.</div>';
    return;
  }

  const body = rows.map((r) => \`
    <tr>
      <td class="date">\${fmtDate(r.createdAt)}</td>
      <td class="mono">\${escapeHtml(r.clientPhone)}</td>
      <td>\${escapeHtml(r.type ?? "—")}</td>
      <td class="amount">\${escapeHtml(r.amount)} FCFA</td>
      <td class="mono">\${escapeHtml(r.oneXBetId)}</td>
      <td>\${escapeHtml(r.operator)}</td>
      <td class="mono">\${escapeHtml(r.operatorPhone)}</td>
      <td>\${statusPill(r.status)}</td>
    </tr>
  \`).join("");

  content.innerHTML = \`
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Client</th><th>Type</th><th>Montant</th>
          <th>ID 1xBet</th><th>Opérateur</th><th>N° opérateur</th><th>Statut</th>
        </tr>
      </thead>
      <tbody>\${body}</tbody>
    </table>
  \`;
}

document.getElementById("history-search").addEventListener("input", renderHistory);
document.getElementById("history-filter").addEventListener("change", renderHistory);

/* ── Boot ── */
function loadAll() { loadPending(); loadHistory(); }
document.getElementById("refresh").addEventListener("click", loadAll);
loadAll();
setInterval(loadAll, 15000);
</script>
</body>
</html>`;
