import { useEffect, useState, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { WaterGlass } from "../components/ui/WaterGlass";
import { CircularProgress } from "../components/ui/CircularProgress";
import { DrinkHistoryModal } from "../components/ui/DrinkHistoryModal";
import { api } from "../lib/api";

function formatMl(ml: number): string {
  if (ml >= 1000) return (ml / 1000).toFixed(2).replace(".", ",") + "L";
  return ml + "ml";
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const CopoSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
    <path d="M30 20 L38 80 A 4 4 0 0 0 42 84 L58 84 A 4 4 0 0 0 62 80 L70 20 Z" stroke="#3b6377" strokeWidth="6" strokeLinejoin="round" fill="rgba(191,232,255,0.2)" />
    <path d="M33 35 L37 78 L63 78 L67 35 Z" fill="#5ABEFF" opacity="0.7" />
  </svg>
);

const BottleSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
    <rect x="44" y="8" width="12" height="6" rx="1.5" fill="#3b6377" />
    <rect x="46" y="14" width="8" height="10" fill="#e0e3e6" stroke="#3b6377" strokeWidth="4" />
    <path d="M36 24 L64 24 Q68 24 68 28 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 28 Q32 24 36 24 Z" stroke="#3b6377" strokeWidth="6" fill="rgba(191,232,255,0.2)" />
    <path d="M34 40 L66 40 L66 86 Q66 88 64 88 L36 88 Q34 88 34 86 Z" fill="#5ABEFF" opacity="0.7" />
  </svg>
);

const SportsBottleSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
    <path d="M42 12 L58 12 L56 7 L44 7 Z" fill="#3b6377" />
    <rect x="46" y="12" width="8" height="8" fill="#e0e3e6" stroke="#3b6377" strokeWidth="4" />
    <path d="M36 20 L64 20 Q68 20 68 24 L66 40 L68 44 L66 48 L68 52 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 52 L34 48 L32 44 L34 40 Z" stroke="#3b6377" strokeWidth="6" fill="rgba(191,232,255,0.2)" />
    <path d="M34 40 L66 40 L66 86 Q66 88 64 88 L36 88 Q34 88 34 86 Z" fill="#5ABEFF" opacity="0.7" />
  </svg>
);

const JugSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
    <rect x="42" y="8" width="16" height="6" fill="#3b6377" />
    <rect x="44" y="14" width="12" height="8" fill="#e0e3e6" stroke="#3b6377" strokeWidth="4" />
    <path d="M26 30 L74 30 Q78 30 78 34 L78 86 Q78 90 74 90 L26 90 Q22 90 22 86 L22 34 Q22 30 26 30 Z" stroke="#3b6377" strokeWidth="6" fill="rgba(191,232,255,0.2)" />
    <path d="M78 40 L84 40 L84 62 L78 62" stroke="#3b6377" strokeWidth="6" strokeLinecap="round" />
    <path d="M24 45 L76 45 L76 86 Q76 88 74 88 L26 88 Q24 88 24 86 Z" fill="#5ABEFF" opacity="0.7" />
  </svg>
);

export function Dashboard() {
  const { todayStats, loadTodayStats, logDrink, settings, loadSettings, weekStats, loadWeekStats, drinkTick } = useAppStore();
  const [undoVisible, setUndoVisible] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadTodayStats();
    loadSettings();
    loadWeekStats();
    const interval = setInterval(() => {
      loadTodayStats();
      loadWeekStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload week stats whenever a drink is logged (real-time goal indicator)
  useEffect(() => {
    loadWeekStats();
  }, [drinkTick, todayStats?.consumed_ml]);

  const handleLogDrink = async (amount: number) => {
    await logDrink(amount);
    setLastAmount(amount);
    setUndoVisible(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoVisible(false), 5000);
  };

  const handleUndo = async () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoVisible(false);
    const stats = await api.deleteLastDrink();
    useAppStore.setState({ todayStats: stats });
  };

  const stats = todayStats;
  const percent = stats?.percent ?? 0;
  const consumed = stats?.consumed_ml ?? 0;
  const goal = stats?.goal_ml ?? 2500;
  const remaining = stats?.remaining_ml ?? goal;
  const streak = stats?.streak ?? 0;
  const suggested = stats?.suggested_per_reminder ?? 250;
  // Always use the per-reminder suggested amount — the small "normal sip" size
  const drinkAmount = suggested;

  // Build current calendar week (Sun→Sat) with goal-reached flag per day
  const weekTimeline = (() => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(now.getDate() - now.getDay());
    const todayIso = now.toISOString().slice(0, 10);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const entry = weekStats.find((s) => s.date === iso);
      const reached = !!entry && entry.consumed_ml >= entry.goal_ml && entry.goal_ml > 0;
      return { label: WEEK_DAYS[i], isToday: iso === todayIso, reached };
    });
  })();

  const getContainerGoalText = () => {
    if (!settings || !settings.recipiente_configurado) return null;
    const capacity = settings.recipiente_capacidade_ml;
    const count = goal / capacity;
    const formattedCount = count.toFixed(1).replace(".0", "").replace(".", ",");
    
    let containerName = "garrafas";
    if (capacity < 350) {
      containerName = count <= 1 ? "copo" : "copos";
    } else if (capacity >= 1800) {
      containerName = count <= 1 ? "garrafão" : "garrafões";
    } else {
      containerName = count <= 1 ? "garrafa" : "garrafas";
    }
    
    return `ou ${formattedCount} ${containerName} de ${capacity}ml`;
  };

  return (
    <div className="flex flex-col h-full" style={{ marginLeft: "280px" }}>
      {/* Fixed header */}
      <header className="flex justify-between items-end px-10 pt-10 pb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-medium mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
            Resumo Diário
          </h2>
          <p className="text-base" style={{ color: "#5B6572" }}>
            Acompanhe seu fluxo de hidratação de hoje.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3b6377" }}>Hoje</p>
          <p className="text-base font-medium" style={{ color: "#191c1e" }}>{formatDate()}</p>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-10 pb-10">

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Consumed card */}
          <div className="bg-white rounded-xl p-6 border border-white/20 group hover:border-[#006492] transition-colors duration-300 relative overflow-hidden"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5B6572" }}>
                    Consumido
                  </p>
                  <button
                    onClick={() => setHistoryOpen(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3b6377] hover:bg-[#bfe8ff]/50 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
                    title="Editar registros de hoje"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                </div>
                <h3 className="text-5xl font-semibold leading-none cursor-pointer" style={{ color: "#3b6377", letterSpacing: "-0.04em" }}
                  onClick={() => setHistoryOpen(true)}
                  title="Editar registros de hoje">
                  {consumed >= 1000 ? (consumed / 1000).toFixed(2).replace(".", ",") : consumed}
                  <span className="text-2xl font-medium" style={{ color: "#5B6572" }}>
                    {consumed >= 1000 ? "L" : "ml"}
                  </span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(191,232,255,0.5)" }}>
                {settings?.recipiente_configurado ? (
                  (() => {
                    const cap = settings.recipiente_capacidade_ml;
                    if (cap < 350) return <CopoSvg />;
                    if (cap >= 350 && cap < 1200) return <BottleSvg />;
                    if (cap >= 1200 && cap < 1800) return <SportsBottleSvg />;
                    return <JugSvg />;
                  })()
                ) : (
                  <span className="material-symbols-outlined" style={{ color: "#3b6377" }}>local_drink</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <CircularProgress percent={percent} size={64} />
              <div className="text-sm" style={{ color: "#5B6572" }}>
                da sua meta de{" "}
                <strong style={{ color: "#191c1e" }}>{formatMl(goal)}</strong>
                {settings?.recipiente_configurado && (
                  <span className="block text-xs mt-0.5 font-medium text-[#3b6377]">
                    {getContainerGoalText()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Remaining card */}
          <div className="bg-white rounded-xl p-6 border border-white/20 group hover:border-[#006492] transition-colors duration-300"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5B6572" }}>Restante</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-semibold leading-none" style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
                {remaining >= 1000 ? (remaining / 1000).toFixed(2).replace(".", ",") : remaining}
                <span className="text-base" style={{ color: "#5B6572" }}>
                  {remaining >= 1000 ? "L" : "ml"}
                </span>
              </h3>
              <p className="text-base pb-1" style={{ color: "#5B6572" }}>para atingir a meta</p>
            </div>
          </div>

          {/* Quick action */}
          <button
            onClick={() => handleLogDrink(drinkAmount)}
            className="w-full rounded-xl p-6 flex items-center justify-between group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] mt-auto cursor-pointer"
            style={{ background: "linear-gradient(135deg, #3b6377 0%, #0d658c 100%)" }}
          >
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#bfe8ff" }}>
                Registro Rápido
              </p>
              <h3 className="text-2xl font-medium text-white" style={{ letterSpacing: "-0.01em" }}>
                {settings?.recipiente_configurado ? (
                  `Beber 1 ${
                    settings.recipiente_capacidade_ml < 350
                      ? "Copo"
                      : settings.recipiente_capacidade_ml >= 1800
                      ? "Garrafão"
                      : "Garrafa"
                  } (+${drinkAmount}ml)`
                ) : (
                  `Beber +${drinkAmount}ml`
                )}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors group-hover:bg-white/30"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <span className="material-symbols-outlined text-white">add</span>
            </div>
          </button>
        </div>

        {/* Center: Water glass */}
        <div className="col-span-12 lg:col-span-5 flex justify-center items-center relative min-h-[500px]">
          <WaterGlass percent={percent} className="min-h-[500px]" />
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          {/* Streak */}
          <div className="bg-white rounded-xl p-6 border border-white/20 group hover:border-[#006492] transition-colors duration-300"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(201,230,255,0.5)" }}>
                <span className="material-symbols-outlined" style={{ color: "#006492" }}>local_fire_department</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#5B6572" }}>Streak Atual</p>
            </div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-5xl font-semibold leading-none" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
                {streak}
              </h3>
              <p className="text-base" style={{ color: "#5B6572" }}>dias seguidos</p>
            </div>
            {/* Week timeline — only days where goal was reached are dark blue */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
              {weekTimeline.map((d, i) => (
                <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors"
                  style={{
                    backgroundColor: d.reached ? "#3b6377" : "#e0e3e6",
                    color: d.reached ? "#ffffff" : "#71787c",
                    outline: d.isToday ? "2px solid #3b6377" : "none",
                    outlineOffset: "2px",
                  }}
                  title={d.isToday ? "Hoje" : undefined}>
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-xl p-6 border mt-auto"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(255,255,255,0.3)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
            }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-1" style={{ color: "#3b6377" }}>lightbulb</span>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#191c1e" }}>Dica de Hidratação</p>
                <p className="text-sm" style={{ color: "#5B6572", lineHeight: "1.6" }}>
                  Beber um copo de água antes das refeições pode ajudar na digestão e na sensação de saciedade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>{/* end scrollable */}

      {/* Undo toast */}
      {undoVisible && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg animate-fade-in"
          style={{
            background: "rgba(25,28,30,0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 100,
            marginLeft: "140px",
          }}
        >
          <span className="text-sm font-medium text-white">
            +{lastAmount}ml registrado
          </span>
          <button
            onClick={handleUndo}
            className="text-sm font-semibold px-3 py-1 rounded-lg transition-colors hover:bg-white/20"
            style={{ color: "#7DD8F8" }}
          >
            Desfazer
          </button>
          <button onClick={() => setUndoVisible(false)} className="text-white/40 hover:text-white/70 ml-1">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <DrinkHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
