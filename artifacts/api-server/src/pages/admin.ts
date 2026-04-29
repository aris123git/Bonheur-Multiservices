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
    padding: 32px 24px;
  }
  .wrap { max-width: 1100px; margin: 0 auto; }
  header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
  h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
  .sub { margin: 2px 0 0; font-size: 13px; color: #64748b; }
  .meta { font-size: 12px; color: #94a3b8; }
  .card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    box-shadow: 0 1px 2px rgba(0,0,0,.04); overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 12px 14px; vertical-align: middle; }
  thead th {
    font-size: 11px; text-transform: uppercase; letter-spacing: .08em;
    color: #94a3b8; font-weight: 600; background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  tbody tr + tr td { border-top: 1px solid #f1f5f9; }
  td.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; color: #334155; }
  td.amount { font-weight: 600; color: #0f172a; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; }
  button {
    font: inherit; cursor: pointer; border: 1px solid transparent;
    padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 500;
    transition: opacity .15s;
  }
  button:disabled { opacity: .5; cursor: not-allowed; }
  .btn-confirm { background: #10b981; color: #fff; border-color: #059669; }
  .btn-confirm:hover:not(:disabled) { background: #059669; }
  .btn-cancel { background: #fff; color: #b91c1c; border-color: #fecaca; }
  .btn-cancel:hover:not(:disabled) { background: #fef2f2; }
  .empty { padding: 48px 24px; text-align: center; color: #94a3b8; font-size: 14px; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 500;
    background: #fef3c7; color: #92400e; border: 1px solid #fde68a;
  }
  .toolbar { display: flex; align-items: center; gap: 8px; }
  .refresh {
    background: #fff; color: #0f172a; border: 1px solid #e2e8f0;
    padding: 6px 12px; border-radius: 8px; font-size: 13px; cursor: pointer;
  }
  .refresh:hover { background: #f8fafc; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>Transactions en attente</h1>
        <p class="sub">Bonheur Multiservices · 1xBet</p>
      </div>
      <div class="toolbar">
        <span class="meta" id="meta">—</span>
        <button class="refresh" id="refresh">Rafraîchir</button>
      </div>
    </header>
    <div class="card">
      <div id="content">
        <div class="empty">Chargement…</div>
      </div>
    </div>
  </div>

<script>
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

async function load() {
  const content = document.getElementById("content");
  const meta = document.getElementById("meta");
  try {
    const res = await fetch("/api/admin/transactions?status=pending", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const rows = data.transactions || [];
    meta.textContent = rows.length + (rows.length === 1 ? " en attente" : " en attente");

    if (rows.length === 0) {
      content.innerHTML = '<div class="empty">Aucune transaction en attente.</div>';
      return;
    }

    const body = rows.map((r) => \`
      <tr data-id="\${r.id}">
        <td class="mono">\${escapeHtml(r.clientPhone)}</td>
        <td class="amount">\${escapeHtml(r.amount)}</td>
        <td class="mono">\${escapeHtml(r.oneXBetId)}</td>
        <td>\${escapeHtml(r.operator)}</td>
        <td class="mono">\${escapeHtml(r.operatorPhone)}</td>
        <td><span class="pill">En attente</span><div style="font-size:11px;color:#94a3b8;margin-top:4px">\${fmtDate(r.createdAt)}</div></td>
        <td>
          <div class="actions">
            <button class="btn-confirm" data-action="confirm" data-id="\${r.id}">Confirmer</button>
            <button class="btn-cancel" data-action="cancel" data-id="\${r.id}">Annuler</button>
          </div>
        </td>
      </tr>
    \`).join("");

    content.innerHTML = \`
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Montant</th>
            <th>ID 1xBet</th>
            <th>Opérateur</th>
            <th>Numéro opérateur</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>\${body}</tbody>
      </table>
    \`;
  } catch (err) {
    content.innerHTML = '<div class="empty">Erreur de chargement : ' + escapeHtml(err.message) + '</div>';
  }
}

async function act(id, action, btn) {
  const row = btn.closest("tr");
  const buttons = row.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));
  try {
    const res = await fetch("/api/admin/transactions/" + id + "/" + action, {
      method: "POST",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    row.style.transition = "opacity .2s";
    row.style.opacity = "0";
    setTimeout(load, 220);
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

document.getElementById("refresh").addEventListener("click", load);
load();
setInterval(load, 15000);
</script>
</body>
</html>`;
