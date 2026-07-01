import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { api, ScheduleData, ScheduleEntry } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";

function StatusBadge({ status, isOverride }: { status: ScheduleEntry["status"]; isOverride: boolean }) {
  if (status === "confirmed") return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-success-container, #dcedc8)", color: "var(--color-success, #33691e)" }}>Bebido</span>;
  if (status === "missed") return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-error-container, #ffe0b2)", color: "var(--color-error, #bf360c)" }}>Perdido</span>;
  if (status === "next") return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: isOverride ? "var(--color-warning-container, #fff9c4)" : "var(--color-info-container, #bbdefb)", color: isOverride ? "var(--color-warning, #827717)" : "var(--color-info, #0d47a1)" }}>{isOverride ? "Editado" : "Próximo"}</span>;
  return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-outline">Futuro</span>;
}

function EntryRow({ entry, onEdit, isBasicMode }: { entry: ScheduleEntry; onEdit?: () => void; isBasicMode: boolean }) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl border transition-colors"
      style={{
        borderColor: entry.status === "next" ? "var(--color-primary, #257ca3)" : "var(--color-border-subtle, rgba(44,52,64,0.08))",
        backgroundColor: entry.status === "next" ? "var(--color-primary-container, rgba(191,232,255,0.25))" : "var(--color-surface-container-lowest, white)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[22px]" style={{ color: "var(--color-primary, #257ca3)" }}>
          {entry.status === "confirmed" ? "check_circle" : entry.status === "missed" ? "cancel" : "schedule"}
        </span>
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--color-on-surface, #191c1e)" }}>{entry.time}</div>
          {!isBasicMode && (
            <div className="text-[11px]" style={{ color: "var(--color-text-main, #5B6572)" }}>
              {entry.sips} {entry.sips === 1 ? "gole" : "goles"} · {entry.amount_ml}ml
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={entry.status} isOverride={entry.is_override} />
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-primary hover:bg-primary-container/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            title="Editar próximo lembrete"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        )}
      </div>
    </div>
  );
}

function EditNextModal({
  open,
  defaultTime,
  defaultMl,
  sipMl,
  onClose,
  onSave,
  onReset,
}: {
  open: boolean;
  defaultTime: string;
  defaultMl: number;
  sipMl: number;
  onClose: () => void;
  onSave: (time: string, ml: number) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const { settings } = useAppStore();
  const isBasicMode = settings?.app_mode === "basic";
  const [time, setTime] = useState(defaultTime);
  const [ml, setMl] = useState(defaultMl);

  useEffect(() => {
    if (open) {
      setTime(defaultTime);
      setMl(defaultMl);
    }
  }, [open, defaultTime, defaultMl]);

  if (!open) return null;

  const sips = Math.ceil(ml / Math.max(1, sipMl));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-surface-container rounded-2xl p-6 w-[420px] max-w-[90vw] shadow-2xl border border-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[28px]" style={{ color: "var(--color-primary, #257ca3)" }}>edit_calendar</span>
          <h2 className="text-xl font-bold" style={{ color: "var(--color-on-surface, #191c1e)" }}>Editar próximo lembrete</h2>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-main, #5B6572)" }}>Horário</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-dark bg-surface"
            style={{ borderColor: "var(--color-outline-variant, #e0e3e6)" }}
          />
        </label>

        {!isBasicMode && (
          <label className="block mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-main, #5B6572)" }}>Quantidade</span>
              <span className="text-sm font-bold" style={{ color: "var(--color-primary, #257ca3)" }}>{ml}ml · {sips} {sips === 1 ? "gole" : "goles"}</span>
            </div>
            <input
              type="range"
              min={sipMl}
              max={sipMl * 20}
              step={sipMl}
              value={ml}
              onChange={(e) => setMl(Number(e.target.value))}
              className="w-full focus:outline-none"
            />
          </label>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-surface-container-high transition-colors"
            style={{ backgroundColor: "var(--color-surface-container-high, rgba(236,238,241,0.7))", color: "var(--color-text-main, #5B6572)" }}
          >
            Restaurar padrão
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-surface-container-high transition-colors"
            style={{ backgroundColor: "var(--color-surface-container-high, rgba(236,238,241,0.7))", color: "var(--color-text-main, #5B6572)" }}
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              await onSave(time, ml);
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer hover:shadow-md transition-shadow"
            style={{ background: "linear-gradient(180deg, var(--color-primary, #257ca3) 0%, var(--color-secondary, #0f76a0) 100%)" }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export function Reminders() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [editing, setEditing] = useState(false);
  const { settings, loadSettings } = useAppStore();
  const isBasicMode = settings?.app_mode === "basic";

  const reload = async () => {
    try {
      const s = await api.getReminderSchedule();
      setData(s);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reload();
    const tick = setInterval(reload, 10000); // fallback poll
    const unlisten = listen("schedule_changed", () => reload());
    return () => {
      clearInterval(tick);
      unlisten.then((fn) => fn());
    };
  }, []);

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center" style={{ marginLeft: "280px" }}>
        <p style={{ color: "var(--color-text-main, #5B6572)" }}>Carregando...</p>
      </div>
    );
  }

  const totalConfirmed = data.past.filter((p) => p.status === "confirmed").length;
  const totalMissed = data.past.filter((p) => p.status === "missed").length;

  const handleSaveOverride = async (time: string, ml: number) => {
    const today = new Date();
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h || 0, m || 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const iso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
    await api.setNextReminderOverride(iso, ml);
    await loadSettings();
    await reload();
    setEditing(false);
  };

  const handleReset = async () => {
    await api.clearNextReminderOverride();
    await loadSettings();
    await reload();
    setEditing(false);
  };

  return (
    <div className="flex flex-col h-full" style={{ marginLeft: "280px" }}>
      <header className="px-10 pt-10 pb-4 shrink-0">
        <h1 className="text-5xl font-semibold mb-2" style={{ color: "var(--color-primary, #257ca3)", letterSpacing: "-0.04em" }}>
          Lembretes
        </h1>
        <p className="text-lg text-text-main">
          {isBasicMode 
            ? "Acompanhe os lembretes do dia. Ajuste o próximo horário se necessário."
            : "Acompanhe os lembretes do dia. Editar o próximo se beber em quantidade diferente."
          }
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="glass-surface rounded-xl p-4 transition-all duration-300">
            <div className="text-[11px] uppercase font-bold text-text-main">Aceitos hoje</div>
            <div className="text-3xl font-bold mt-1" style={{ color: "var(--color-success, #33691e)" }}><AnimatedNumber value={totalConfirmed} /></div>
          </div>
          <div className="glass-surface rounded-xl p-4 transition-all duration-300">
            <div className="text-[11px] uppercase font-bold text-text-main">Perdidos hoje</div>
            <div className="text-3xl font-bold mt-1" style={{ color: "var(--color-error, #bf360c)" }}><AnimatedNumber value={totalMissed} /></div>
          </div>
          <div className="glass-surface rounded-xl p-4 transition-all duration-300">
            <div className="text-[11px] uppercase font-bold text-text-main">Faltam hoje</div>
            <div className="text-3xl font-bold mt-1" style={{ color: "var(--color-primary, #0d47a1)" }}><AnimatedNumber value={(data.next ? 1 : 0) + data.upcoming.length} /></div>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-main mb-3">Próximo</h2>
          {data.next ? (
            <EntryRow entry={data.next} onEdit={() => setEditing(true)} isBasicMode={isBasicMode} />
          ) : (
            <div className="text-sm text-outline italic">Sem lembretes restantes hoje.</div>
          )}
        </section>

        {data.upcoming.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-main mb-3">Próximos</h2>
            <div className="space-y-2">
              {data.upcoming.map((e, i) => <EntryRow key={i} entry={e} isBasicMode={isBasicMode} />)}
            </div>
          </section>
        )}

        {data.past.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-main mb-3">Histórico de hoje</h2>
            <div className="space-y-2">
              {data.past.map((e, i) => <EntryRow key={i} entry={e} isBasicMode={isBasicMode} />)}
            </div>
          </section>
        )}
      </div>

      <EditNextModal
        open={editing}
        defaultTime={data.next?.time || "08:00"}
        defaultMl={data.next?.amount_ml || data.sip_ml}
        sipMl={data.sip_ml}
        onClose={() => setEditing(false)}
        onSave={handleSaveOverride}
        onReset={handleReset}
      />
    </div>
  );
}
