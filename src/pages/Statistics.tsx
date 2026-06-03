import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { api, DayStats } from "../lib/api";
import { DrinkHistoryModal } from "../components/ui/DrinkHistoryModal";
import { DatePicker } from "../components/ui/DatePicker";

type Period = "7d" | "30d" | "90d" | "custom";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(period: Period): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  if (period === "7d") start.setDate(end.getDate() - 6);
  else if (period === "30d") start.setDate(end.getDate() - 29);
  else if (period === "90d") start.setDate(end.getDate() - 89);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

function formatHumanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

interface BarProps {
  stats: DayStats;
  maxMl: number;
  showLabel: boolean;
  onClick: () => void;
  onHover: (e: React.MouseEvent, stats: DayStats) => void;
  onLeave: () => void;
}

function Bar({ stats, maxMl, showLabel, onClick, onHover, onLeave }: BarProps) {
  const pct = maxMl > 0 ? Math.min((stats.consumed_ml / maxMl) * 100, 100) : 0;
  const reached = stats.consumed_ml >= stats.goal_ml && stats.goal_ml > 0;
  const label = stats.date.slice(5).replace("-", "/");

  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => onHover(e, stats)}
      onMouseMove={(e) => onHover(e, stats)}
      onMouseLeave={onLeave}
      className="flex flex-col items-center gap-1 flex-1 min-w-0 cursor-pointer group"
    >
      <div
        className="w-full flex flex-col justify-end rounded-lg relative transition-all duration-200 group-hover:brightness-110"
        style={{
          height: "120px",
          backgroundColor: "#eceef1",
          overflow: "hidden",
        }}
      >
        {/* Tinted overlay on hover (subtle blue wash) */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "linear-gradient(180deg, rgba(191,232,255,0.35) 0%, rgba(125,216,248,0.18) 100%)" }}
        />
        <div
          className="w-full rounded-lg transition-all duration-700 relative"
          style={{
            height: `${pct}%`,
            background: reached
              ? "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)"
              : "linear-gradient(180deg, #a4cce3 0%, #bfe8ff 100%)",
          }}
        />
        {reached && showLabel && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="material-symbols-outlined text-white" style={{ fontSize: "14px" }}>check</span>
          </div>
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] font-semibold tracking-wider truncate w-full text-center" style={{ color: "#71787c" }}>{label}</span>
      )}
    </button>
  );
}

interface TooltipData {
  stats: DayStats;
  x: number;
  y: number;
}

function HoverTooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;
  const { stats, x, y } = data;
  const reached = stats.consumed_ml >= stats.goal_ml && stats.goal_ml > 0;
  const consumedL = (stats.consumed_ml / 1000).toFixed(2).replace(".", ",");
  const goalL = (stats.goal_ml / 1000).toFixed(2).replace(".", ",");
  const progressPct = stats.goal_ml > 0 ? Math.round((stats.consumed_ml / stats.goal_ml) * 100) : 0;

  // Position above the cursor; clamp to viewport
  const tooltipWidth = 180;
  const tooltipHeight = 90;
  const margin = 12;
  let left = x - tooltipWidth / 2;
  let top = y - tooltipHeight - margin;
  if (left < 8) left = 8;
  if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;
  if (top < 8) top = y + margin; // flip below if no room above

  return (
    <div
      className="pointer-events-none animate-fade-in"
      style={{
        position: "fixed",
        left,
        top,
        width: tooltipWidth,
        zIndex: 9999,
      }}
    >
      <div
        className="px-3 py-2 rounded-xl"
        style={{
          background: "rgba(25,28,30,0.94)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#7DD8F8" }}>
          {formatHumanDate(stats.date)}
        </div>
        <div className="text-sm font-semibold text-white">
          {consumedL}L <span className="text-xs font-normal" style={{ color: "#a4cce3" }}>/ {goalL}L</span>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: reached ? "#7DD8F8" : "#c1c7cc" }}>
          {reached ? `✓ Meta atingida (${progressPct}%)` : `${progressPct}% da meta`}
        </div>
        <div className="text-[10px] mt-1.5 italic" style={{ color: "#71787c" }}>
          Clique para editar
        </div>
      </div>
    </div>
  );
}

export function Statistics() {
  const { todayStats, loadTodayStats, drinkTick } = useAppStore();
  const [period, setPeriod] = useState<Period>("7d");
  const [customStart, setCustomStart] = useState<string>(() => defaultRange("7d").start);
  const [customEnd, setCustomEnd] = useState<string>(() => defaultRange("7d").end);
  const [chartData, setChartData] = useState<DayStats[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const handleHover = (e: React.MouseEvent, s: DayStats) => {
    setTooltip({ stats: s, x: e.clientX, y: e.clientY });
  };
  const handleLeave = () => setTooltip(null);

  useEffect(() => {
    loadTodayStats();
  }, []);

  const { start, end } = useMemo(() => {
    if (period === "custom") return { start: customStart, end: customEnd };
    return defaultRange(period);
  }, [period, customStart, customEnd]);

  useEffect(() => {
    if (!start || !end || start > end) {
      setChartData([]);
      return;
    }
    api.getRangeStats(start, end).then(setChartData).catch(() => setChartData([]));
  }, [start, end, drinkTick]);

  const stats = todayStats;
  const maxMl = chartData.length > 0 ? Math.max(...chartData.map((d) => Math.max(d.consumed_ml, d.goal_ml))) : 3000;

  const avgConsumed = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.consumed_ml, 0) / chartData.length)
    : 0;
  const daysGoalReached = chartData.filter((d) => d.consumed_ml >= d.goal_ml).length;

  return (
    <div className="flex flex-col h-full" style={{ marginLeft: "280px" }}>
      <header className="px-10 pt-10 pb-6 shrink-0">
        <h1 className="text-5xl font-semibold mb-2" style={{ color: "#3b6377", letterSpacing: "-0.04em" }}>
          Estatísticas
        </h1>
        <p className="text-lg" style={{ color: "#41484c" }}>Acompanhe sua evolução de hidratação.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">

      {/* Today summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Meta", value: `${((stats?.goal_ml ?? 0) / 1000).toFixed(2).replace(".", ",")}L` },
          { label: "Consumido", value: `${((stats?.consumed_ml ?? 0) / 1000).toFixed(2).replace(".", ",")}L` },
          { label: "Restante", value: `${((stats?.remaining_ml ?? 0) / 1000).toFixed(2).replace(".", ",")}L` },
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
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-2xl font-medium" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
            Histórico
          </h2>
          <div className="flex gap-2 flex-wrap">
            {([
              { id: "7d", label: "7 dias" },
              { id: "30d", label: "30 dias" },
              { id: "90d", label: "90 dias" },
              { id: "custom", label: "Personalizado" },
            ] as { id: Period; label: string }[]).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: period === p.id ? "#3b6377" : "#eceef1",
                  color: period === p.id ? "#ffffff" : "#5B6572",
                  letterSpacing: "0.02em",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl flex-wrap" style={{ backgroundColor: "#f7f9fc" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5B6572" }}>
              <span>De</span>
              <DatePicker
                value={customStart}
                max={customEnd}
                onChange={setCustomStart}
                label="Data inicial"
              />
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5B6572" }}>
              <span>até</span>
              <DatePicker
                value={customEnd}
                min={customStart}
                max={toIsoDate(new Date())}
                onChange={setCustomEnd}
                label="Data final"
              />
            </div>
            <span className="text-xs ml-auto" style={{ color: "#71787c" }}>
              {chartData.length} {chartData.length === 1 ? "dia" : "dias"} no período
            </span>
          </div>
        )}

        {(() => {
          const count = chartData.length;
          const showLabels = count <= 14;
          const gap = count > 60 ? 2 : count > 30 ? 3 : 4;
          return (
            <div className="w-full overflow-x-hidden overflow-y-visible py-1">
              <div className="flex items-end w-full" style={{ gap: `${gap}px` }}>
                {chartData.map((d) => (
                  <Bar
                    key={d.date}
                    stats={d}
                    maxMl={maxMl}
                    showLabel={showLabels}
                    onClick={() => setEditingDate(d.date)}
                    onHover={handleHover}
                    onLeave={handleLeave}
                  />
                ))}
                {count === 0 && (
                  <div className="w-full text-center py-12" style={{ color: "#5B6572" }}>
                    Sem dados para o período selecionado.
                  </div>
                )}
              </div>
              {!showLabels && count > 0 && (
                <div className="flex justify-between mt-2 text-[10px] font-semibold tracking-wider" style={{ color: "#71787c" }}>
                  <span>{formatHumanDate(chartData[0].date)}</span>
                  {count >= 3 && (
                    <span>{formatHumanDate(chartData[Math.floor(count / 2)].date)}</span>
                  )}
                  <span>{formatHumanDate(chartData[count - 1].date)}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Legend */}
        <div className="flex gap-6 mt-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3b6377" }} />
            <span className="text-xs" style={{ color: "#5B6572" }}>Meta atingida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#bfe8ff" }} />
            <span className="text-xs" style={{ color: "#5B6572" }}>Parcial</span>
          </div>
          <span className="text-xs ml-auto italic" style={{ color: "#71787c" }}>
            Clique em uma barra para editar os registros daquele dia.
          </span>
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
            {avgConsumed >= 1000 ? `${(avgConsumed / 1000).toFixed(2).replace(".", ",")}L` : `${avgConsumed}ml`}
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

      </div>{/* end scrollable */}

      <HoverTooltip data={tooltip} />

      <DrinkHistoryModal
        open={editingDate !== null}
        onClose={async () => {
          setEditingDate(null);
          // Refresh range stats so chart updates
          if (start && end) {
            const fresh = await api.getRangeStats(start, end);
            setChartData(fresh);
          }
        }}
        date={editingDate ?? undefined}
      />
    </div>
  );
}
