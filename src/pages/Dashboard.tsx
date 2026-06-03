import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { WaterGlass } from "../components/ui/WaterGlass";
import { CircularProgress } from "../components/ui/CircularProgress";

function formatMl(ml: number): string {
  if (ml >= 1000) return (ml / 1000).toFixed(1).replace(".", ",") + "L";
  return ml + "ml";
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function Dashboard() {
  const { todayStats, loadTodayStats, logDrink, settings } = useAppStore();

  useEffect(() => {
    loadTodayStats();
    const interval = setInterval(loadTodayStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = todayStats;
  const percent = stats?.percent ?? 0;
  const consumed = stats?.consumed_ml ?? 0;
  const goal = stats?.goal_ml ?? 2500;
  const remaining = stats?.remaining_ml ?? goal;
  const streak = stats?.streak ?? 0;
  const suggested = stats?.suggested_per_reminder ?? 250;

  const today = new Date().getDay();

  return (
    <div className="min-h-screen p-10" style={{ marginLeft: "280px" }}>
      {/* Header */}
      <header className="flex justify-between items-end mb-12">
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

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Consumed card */}
          <div className="bg-white rounded-xl p-6 border border-white/20 group hover:border-[#006492] transition-colors duration-300 relative overflow-hidden"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5B6572" }}>
                  Consumido
                </p>
                <h3 className="text-5xl font-semibold leading-none" style={{ color: "#3b6377", letterSpacing: "-0.04em" }}>
                  {consumed >= 1000 ? (consumed / 1000).toFixed(1) : consumed}
                  <span className="text-2xl font-medium" style={{ color: "#5B6572" }}>
                    {consumed >= 1000 ? "L" : "ml"}
                  </span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(191,232,255,0.5)" }}>
                <span className="material-symbols-outlined" style={{ color: "#3b6377" }}>local_drink</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <CircularProgress percent={percent} size={64} />
              <p className="text-sm" style={{ color: "#5B6572" }}>
                da sua meta de{" "}
                <strong style={{ color: "#191c1e" }}>{formatMl(goal)}</strong>
              </p>
            </div>
          </div>

          {/* Remaining card */}
          <div className="bg-white rounded-xl p-6 border border-white/20 group hover:border-[#006492] transition-colors duration-300"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5B6572" }}>Restante</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-semibold leading-none" style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
                {remaining >= 1000 ? (remaining / 1000).toFixed(1) : remaining}
                <span className="text-base" style={{ color: "#5B6572" }}>
                  {remaining >= 1000 ? "L" : "ml"}
                </span>
              </h3>
              <p className="text-base pb-1" style={{ color: "#5B6572" }}>para atingir a meta</p>
            </div>
          </div>

          {/* Quick action */}
          <button
            onClick={() => logDrink(suggested)}
            className="w-full rounded-xl p-6 flex items-center justify-between group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] mt-auto"
            style={{ background: "linear-gradient(135deg, #3b6377 0%, #0d658c 100%)" }}
          >
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#bfe8ff" }}>
                Registro Rápido
              </p>
              <h3 className="text-2xl font-medium text-white" style={{ letterSpacing: "-0.01em" }}>
                Beber +{suggested}ml
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
            {/* Week timeline */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
              {WEEK_DAYS.map((day, i) => {
                const isToday = i === today;
                const isPast = i < today;
                return (
                  <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{
                      backgroundColor: isPast || isToday ? "#3b6377" : "#e0e3e6",
                      color: isPast || isToday ? "#ffffff" : "#71787c",
                      outline: isToday ? "2px solid #3b6377" : "none",
                      outlineOffset: "2px",
                    }}>
                    {day}
                  </div>
                );
              })}
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
    </div>
  );
}
