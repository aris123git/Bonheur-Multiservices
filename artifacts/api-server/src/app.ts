import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const STATUS_PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>WhatsApp Bot</title>
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
  .wrap { width: 100%; max-width: 560px; }
  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .logo {
    width: 48px; height: 48px; border-radius: 16px; background: #10b981;
    display: flex; align-items: center; justify-content: center;
    color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.05);
  }
  h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
  .sub { margin: 2px 0 0; font-size: 13px; color: #64748b; }
  .card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,.04);
  }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 8px 0; font-size: 14px; }
  .row + .row { border-top: 1px dashed #f1f5f9; }
  .label { color: #64748b; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; color: #0f172a; }
  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500;
    background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.18); }
  .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .header-row .title { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; font-weight: 600; }
  .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div class="logo" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </div>
      <div>
        <h1>WhatsApp Bot</h1>
        <p class="sub">Assistant français propulsé par Claude</p>
      </div>
    </div>
    <div class="card">
      <div class="header-row">
        <span class="title">Statut du service</span>
        <span class="badge"><span class="dot"></span>En ligne</span>
      </div>
      <div class="row"><span class="label">Webhook</span><span class="mono">/api/whatsapp/webhook</span></div>
      <div class="row"><span class="label">Modèle</span><span class="mono">claude-sonnet-4-6</span></div>
      <div class="row"><span class="label">Santé</span><span class="mono">/api/healthz</span></div>
    </div>
    <p class="footer">Envoyez un message WhatsApp au numéro Twilio configuré pour discuter avec le bot.</p>
  </div>
</body>
</html>`;

app.get("/", (_req: Request, res: Response) => {
  res.type("html").send(STATUS_PAGE);
});

export default app;
