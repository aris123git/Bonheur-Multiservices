export function buildLoginPage(error?: string): string {
  const errorHtml = error
    ? `<div class="error">${error}</div>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Connexion · Bonheur Multiservices</title>
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
    width: 100%; max-width: 360px;
  }
  .logo {
    width: 48px; height: 48px; border-radius: 16px; background: #10b981;
    display: flex; align-items: center; justify-content: center;
    color: #fff; margin: 0 auto 20px;
  }
  h1 {
    margin: 0 0 4px; font-size: 20px; font-weight: 600;
    letter-spacing: -0.01em; text-align: center;
  }
  .sub { margin: 0 0 24px; font-size: 13px; color: #64748b; text-align: center; }
  label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #374151; }
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
    border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 16px;
  }
  button {
    width: 100%; margin-top: 16px; padding: 10px;
    background: #10b981; color: #fff; border: none;
    border-radius: 8px; font: inherit; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  button:hover { background: #059669; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <h1>Administration</h1>
    <p class="sub">Bonheur Multiservices · 1xBet</p>
    <form method="POST" action="/admin/login">
      ${errorHtml}
      <label for="password">Mot de passe</label>
      <input type="password" id="password" name="password" autofocus autocomplete="current-password" required />
      <button type="submit">Se connecter</button>
    </form>
  </div>
</body>
</html>`;
}
