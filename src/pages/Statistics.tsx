import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { DayStats } from "../lib/api";

type Period = "today" | "week" | "month";

function Bar({ stats, maxMl }: { stats: DayStats; maxMl: number }) {
  const pct = maxMl > 0 ? Math.min((stats.consumed_ml / maxMl) * 100, 100) : 0;
  const reached = stats.consumed_ml >= stats.goal_ml;
  const label = stats.date.slice(5).replace("-", "/");

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="w-full flex flex-col justify-end rounded-lg overflow-hidden relative"
        style={{ height: "120px", backgroundColor: "#eceef1" }}>
        <div
          className="w-full rounded-lg transition-all duration-700"
          style={{
            height: `${pct}%`,
            background: reached
              ? "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)"
              : "linear-gradient(180deg, #a4cce3 0%, #bfe8ff 100%)",
          }}
        />
        {reached && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontSize: "14px" }}>check</span>
          </div>
        )}
      </div>
      <span className="text-[10px] font-semibold tracking-wider" style={{ color: "#71787c" }}>{label}</span>
    </div>
  );
}

export function Statistics() {
  const { todayStats, weekStats, monthStats, loadTodayStats, loadWeekStats, loadMonthStats } = useAppStore();
  const [period, setPeriod] = useState<Period>("week");

  useEffect(() => {
    loadTodayStats();
    loadWeekStats();
    loadMonthStats();
  }, []);

  const stats = todayStats;
  const chartData: DayStats[] = period === "week" ? weekStats : period === "month" ? monthStats : [];
  const maxMl = chartData.length > 0 ? Math.max(...chartData.map((d) => Math.max(d.consumed_ml, d.goal_ml))) : 3000;

  const avgConsumed = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.consumed_ml, 0) / chartData.length)
    : 0;
  const daysGoalReached = chartData.filter((d) => d.consumed_ml >= d.goal_ml).length;

  return (
    <div className="min-h-screen p-10" style={{ marginLeft: "280px" }}>
      <header className="mb-12">
        <h1 className="text-5xl font-semibold mb-2" style={{ color: "#3b6377", letterSpacing: "-0.04em" }}>
          Estatísticas
        </h1>
        <p className="text-lg" style={{ color: "#41484c" }}>Acompanhe sua evolução de hidratação.</p>
      </header>

      {/* Today summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Meta", value: `${((stats?.goal_ml ?? 0) / 1000).toFixed(1)}L` },
          { label: "Consumido", value: `${((stats?.consumed_ml ?? 0) / 1000).toFixed(1)}L` },
          { label: "Restante", value: `${((stats?.remaining_ml ?? 0) / 1000).toFixed(1)}L` },
          { label: "Progresso", value: `${Math.round(stats?.percent ?? 0)}%` },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl p-6 border border-white/20"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#5B6572" }}>
              {item.label}
            </p>
            <p className="text-3xl font-semibold" style={{ color: "#3b6377", letterSpacing: "-0.02em" }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 border border-white/20 mb-8"
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
            Histórico
          </h2>
          <div className="flex gap-2">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: period === p ? "#3b6377" : "#eceef1",
                  color: period === p ? "#ffffff" : "#5B6572",
                  letterSpacing: "0.02em",
                }}
              >
                {p === "week" ? "7 dias" : "30 dias"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 items-end">
          {chartData.map((d) => (
            <Bar key={d.date} stats={d} maxMl={maxMl} />
          ))}
          {chartData.length === 0 && (
            <div className="w-full text-center py-12" style={{ color: "#5B6572" }}>
              Sem dados para o período selecionado.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3b6377" }} />
            <span className="text-xs" style={{ color: "#5B6572" }}>Meta atingida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#bfe8ff" }} />
            <span className="text-xs" style={{ color: "#5B6572" }}>Parcial</span>
          </div>
        </div>
      </div>

      {/* Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-white/20"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#5B6572" }}>
            Média diária
          </p>
          <p className="text-4xl font-semibold" style={{ color: "#3b6377", letterSpacing: "-0.02em" }}>
            {avgConsumed >= 1000 ? `${(avgConsumed / 1000).toFixed(1)}L` : `${avgConsumed}ml`}
          </p>
          <p className="text-sm mt-1" style={{ color: "#5B6572" }}>no período selecionado</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-white/20"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#5B6572" }}>
            Dias com meta atingida
          </p>
          <p className="text-4xl font-semibold" style={{ color: "#3b6377", letterSpacing: "-0.02em" }}>
            {daysGoalReached}/{chartData.length}
          </p>
          <p className="text-sm mt-1" style={{ color: "#5B6572" }}>dias no período</p>
        </div>
      </div>
    </div>
  );
}
