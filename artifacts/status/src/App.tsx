import { useEffect, useState } from "react";
import { MessageCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "loading" | "online" | "offline";

function App() {
  const [status, setStatus] = useState<Status>("loading");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch("/api/healthz", { cache: "no-store" });
        if (!cancelled) {
          setStatus(res.ok ? "online" : "offline");
          setCheckedAt(new Date());
        }
      } catch {
        if (!cancelled) {
          setStatus("offline");
          setCheckedAt(new Date());
        }
      }
    }

    ping();
    const id = setInterval(ping, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <MessageCircle className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Bot</h1>
            <p className="text-sm text-slate-500">Assistant français propulsé par Claude</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              Statut du service
            </span>
            <StatusBadge status={status} />
          </div>

          <div className="space-y-4 text-sm">
            <Row label="Webhook" value="/api/whatsapp/webhook" mono />
            <Row label="Modèle" value="claude-sonnet-4-6" mono />
            <Row
              label="Dernière vérification"
              value={
                checkedAt
                  ? checkedAt.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "—"
              }
            />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Envoyez un message WhatsApp au numéro Twilio configuré pour discuter avec le bot.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          "text-slate-900 truncate " + (mono ? "font-mono text-xs bg-slate-100 px-2 py-1 rounded" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Vérification
      </span>
    );
  }
  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        En ligne
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
      <AlertCircle className="h-3 w-3" />
      Hors ligne
    </span>
  );
}

export default App;
