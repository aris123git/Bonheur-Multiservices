export function buildChangePasswordPage(opts?: {
  error?: string;
  success?: boolean;
}): string {
  const banner = opts?.success
    ? `<div class="success">Mot de passe mis à jour avec succès.</div>`
    : opts?.error
      ? `<div class="error">${opts.error}</div>`
      : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Changer le mot de passe · Bonheur Multiservices</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Inter", sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #f8fafc;
    color: #0f172a;
    display: flex; align-items: center; justify-content: center;
    padding: 48px 24px;
  }
  .card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,.06);
    width: 100%; max-width: 400px;
  }
  .top { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .back {
    color: #64748b; text-decoration: none; font-size: 13px;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .back:hover { color: #0f172a; }
  h1 { margin: 0; font-size: 18px; font-weight: 600; }
  label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #374151; margin-top: 14px; }
  input[type="password"] {
    width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0;
    border-radius: 8px; font: inherit; font-size: 14px; color: #0f172a;
    background: #f8fafc; outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  input[type="password"]:focus {
    border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.15);
    background: #fff;
  }
  .error {
    background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
    border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 4px;
  }
  .success {
    background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857;
    border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 4px;
  }
  button {
    width: 100%; margin-top: 20px; padding: 10px;
    background: #10b981; color: #fff; border: none;
    border-radius: 8px; font: inherit; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  button:hover { background: #059669; }
  .hint { font-size: 12px; color: #94a3b8; margin-top: 6px; }
</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <a class="back" href="/admin">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Retour au tableau de bord
      </a>
    </div>
    <h1>Changer le mot de passe</h1>
    <form method="POST" action="/admin/change-password">
      ${banner}
      <label for="current">Mot de passe actuel</label>
      <input type="password" id="current" name="current" required autocomplete="current-password" />

      <label for="newpw">Nouveau mot de passe</label>
      <input type="password" id="newpw" name="newpw" required autocomplete="new-password" />
      <p class="hint">Minimum 6 caractères.</p>

      <label for="confirm">Confirmer le nouveau mot de passe</label>
      <input type="password" id="confirm" name="confirm" required autocomplete="new-password" />

      <button type="submit">Mettre à jour</button>
    </form>
  </div>
</body>
</html>`;
}
