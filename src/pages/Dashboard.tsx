import { useEffect, useState, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { WaterGlass } from "../components/ui/WaterGlass";
import { CircularProgress } from "../components/ui/CircularProgress";
import { DrinkHistoryModal } from "../components/ui/DrinkHistoryModal";
import { SetTotalModal } from "../components/ui/SetTotalModal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { UndoChip } from "../components/ui/UndoChip";
import { api } from "../lib/api";
import { useIsDev } from "../lib/useIsDev";

const HYDRATION_TIPS = [
  "Beber água cerca de 30 minutos antes das refeições prepara o sistema digestivo e ajuda na saciedade.",
  "Mantenha uma garrafa de água sempre visível no trabalho para servir como lembrete constante.",
  "Durante os treinos, beba água antes, durante e depois para evitar a fadiga muscular e as cãibras.",
  "Não espere a sede surgir: ela é um sinal biológico de que o corpo já começou a desidratar.",
  "Adicione fatias de limão, hortelã ou pepino na garrafa para dar um sabor natural e refrescante.",
  "Dores de cabeça leves, sonolência e perda de foco costumam ser os primeiros sinais de falta de água.",
  "Perdemos água naturalmente pela respiração durante o sono. Beba um copo logo ao acordar.",
  "Frutas como melancia e melão possuem mais de 90% de água e ajudam a complementar sua meta hídrica.",
  "Monitore sua urina: a cor ideal é amarelo claro. Tons escuros indicam que você precisa beber água.",
  "A ingestão adequada de água mantém a barreira protetora da pele saudável e hidratada.",
  "Prefira beber água em pequenos goles ao longo do dia em vez de tomar grandes volumes de uma vez só.",
  "O álcool desidrata o organismo. Lembre-se de tomar um copo de água para cada dose de bebida alcoólica.",
  "Água levemente fresca (15°C a 20°C) é absorvida pelo organismo mais rápido do que a água muito gelada.",
  "O consumo excessivo de cafeína (café e chás escuros) estimula a eliminação de líquidos. Beba água para manter o equilíbrio.",
  "Idosos sentem menos sede naturalmente devido ao envelhecimento. Incentive-os a beber água.",
  "A falta de água reduz o volume do sangue, fazendo com que o coração trabalhe mais para bombeá-lo.",
  "A água compõe as cartilagens, servindo como lubrificante e amortecedor natural para as articulações.",
  "Em treinos intensos com mais de uma hora de duração, isotônicos ajudam a repor o sódio perdido no suor."
];

function formatMl(ml: number): string {
  if (ml >= 1000) return (ml / 1000).toFixed(2).replace(".", ",") + "L";
  return ml + "ml";
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${r}`;
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const CopoSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-copo-dash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-copo-dash" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <path d="M33 30 L37.5 77.5 A 4 4 0 0 0 41.5 81.5 L58.5 81.5 A 4 4 0 0 0 62.5 77.5 L67 30 Z" fill="url(#water-grad-copo-dash)" />
    <ellipse cx="50" cy="30" rx="17" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    <path d="M30 20 L38 80 A 4 4 0 0 0 42 84 L58 84 A 4 4 0 0 0 62 80 L70 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-copo-dash)" />
    <ellipse cx="50" cy="20" rx="20" ry="4.5" stroke="#257ca3" strokeWidth="4.5" fill="none" />
    <path d="M35 25 L40 76" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M65 25 L59 76" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const BottleSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-bottle-dash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-bottle-dash" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <rect x="44" y="6" width="12" height="6" rx="1.5" fill="#257ca3" />
    <rect x="46" y="12" width="8" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    <path d="M34.5 38 L34.5 85.5 Q34.5 87.5 37.5 87.5 L62.5 87.5 Q65.5 87.5 65.5 85.5 L65.5 38 Z" fill="url(#water-grad-bottle-dash)" />
    <ellipse cx="50" cy="38" rx="15.5" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    <path d="M36 24 L64 24 Q68 24 68 28 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 28 Q32 24 36 24 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-bottle-dash)" />
    <path d="M36 28 L36 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 28 L64 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const SportsBottleSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-sports-dash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-sports-dash" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <path d="M46 6 Q38 6 38 12 Q38 18 46 18" stroke="#257ca3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M44 8 L56 8 L54 3 L46 3 Z" fill="#257ca3" />
    <rect x="46" y="8" width="8" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    
    <path d="M36.5 40 L36.5 85.5 Q36.5 87.5 38.5 87.5 L61.5 87.5 Q63.5 87.5 63.5 85.5 L63.5 40 Z" fill="url(#water-grad-sports-dash)" />
    <ellipse cx="50" cy="40" rx="13.5" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    
    <rect x="34" y="48" width="32" height="22" rx="2" fill="#257ca3" opacity="0.85" />
    <line x1="38" y1="53" x2="62" y2="53" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="59" x2="62" y2="59" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="65" x2="62" y2="65" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    
    <path d="M38 20 L62 20 Q66 20 66 24 L66 86 Q66 90 62 90 L38 90 Q34 90 34 86 L34 24 Q34 20 38 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-sports-dash)" />
    
    <path d="M37.2 28 L37.2 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M62.8 28 L62.8 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const JugSvg = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-jug-dash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-jug-dash" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <rect x="42" y="6" width="16" height="6" fill="#257ca3" />
    <rect x="44" y="12" width="12" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    <path d="M74 28 Q82 28 82 44 L82 68 Q82 84 74 84" stroke="#257ca3" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M28.5 28 L28.5 85.5 Q28.5 87.5 30.5 87.5 L69.5 87.5 Q71.5 87.5 71.5 85.5 L71.5 28 Z" fill="url(#water-grad-jug-dash)" />
    <ellipse cx="50" cy="28" rx="21.5" ry="4" fill="#BFE8FF" opacity="0.8" />
    <path d="M30 20 L70 20 Q74 20 74 24 L74 86 Q74 90 70 90 L30 90 Q26 90 26 86 L26 24 Q26 20 30 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-jug-dash)" />
    <path d="M30 24 L30 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M70 24 L70 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export function Dashboard() {
  const { todayStats, loadTodayStats, logDrink, settings, loadSettings, weekStats, loadWeekStats, drinkTick } = useAppStore();
  const [undoVisible, setUndoVisible] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [setTotalOpen, setSetTotalOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDev = useIsDev();
  const [tipIndex, setTipIndex] = useState(new Date().getDate() % HYDRATION_TIPS.length);
  const [devInputVisible, setDevInputVisible] = useState(false);
  const [customTipText, setCustomTipText] = useState("");

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

  // Se o recipiente estiver configurado, a dose regular é a capacidade da garrafa, caso contrário é o gole sugerido.
  const regularAmount = settings?.recipiente_configurado ? settings.recipiente_capacidade_ml : suggested;
  
  // Se faltar menos do que a dose regular para atingir a meta, registra exatamente o restante para bater 100% sem sobrar mililitros.
  const drinkAmount = (remaining > 0 && remaining < regularAmount) ? remaining : regularAmount;

  // Build current calendar week (Sun→Sat) with goal-reached flag per day
  const weekTimeline = (() => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(now.getDate() - now.getDay());
    const todayIso = toIsoDate(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const iso = toIsoDate(d);
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
      <header className="flex justify-between items-end px-10 pt-6 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-medium mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
            Resumo Diário
          </h2>
          <p className="text-base" style={{ color: "#5B6572" }}>
            Acompanhe seu fluxo de hidratação de hoje.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#257ca3" }}>Hoje</p>
          <p className="text-base font-medium" style={{ color: "#191c1e" }}>{formatDate()}</p>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-10 pb-6">

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Consumed card */}
          <div className="bg-white rounded-xl p-5 border border-white/20 group hover:border-[#006492] transition-colors duration-300 relative overflow-hidden"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5B6572" }}>
                    Consumido
                  </p>
                  <button
                    onClick={() => setHistoryOpen(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
                    title="Editar registros de hoje"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => setSetTotalOpen(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
                    title="Definir total bebido hoje"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                  </button>
                </div>
                <h3 className="text-5xl font-semibold leading-none cursor-pointer" style={{ color: "#257ca3", letterSpacing: "-0.04em" }}
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
                  <span className="material-symbols-outlined" style={{ color: "#257ca3" }}>local_drink</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <CircularProgress percent={percent} size={64} />
              <div className="text-sm" style={{ color: "#5B6572" }}>
                da sua meta de{" "}
                <strong style={{ color: "#191c1e" }}>{formatMl(goal)}</strong>
                {settings?.recipiente_configurado && (
                  <span className="block text-xs mt-0.5 font-medium text-[#257ca3]">
                    {getContainerGoalText()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Remaining card */}
          <div className="bg-white rounded-xl p-5 border border-white/20 group hover:border-[#006492] transition-colors duration-300"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5B6572" }}>Restante</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-semibold leading-none" style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
                <AnimatedNumber
                  value={remaining}
                  format={(n) => remaining >= 1000 ? (n / 1000).toFixed(2).replace(".", ",") : String(Math.round(n))}
                />
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
            className="w-full rounded-xl p-5 flex items-center justify-between group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] mt-auto cursor-pointer"
            style={{ background: "linear-gradient(135deg, #257ca3 0%, #0f76a0 100%)" }}
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
          <div className="h-12 flex items-center justify-center shrink-0 mt-2">
            {undoVisible && (
              <UndoChip
                key={lastAmount + "-dash"}
                amount={lastAmount}
                onUndo={handleUndo}
                onExpire={() => setUndoVisible(false)}
              />
            )}
          </div>
        </div>

        {/* Center: Water glass */}
        <div className="col-span-12 lg:col-span-5 flex justify-center items-center relative min-h-[420px]">
          <WaterGlass percent={percent} className="min-h-[420px]" />
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          {/* Streak */}
          <div className="bg-white rounded-xl p-5 border border-white/20 group hover:border-[#006492] transition-colors duration-300"
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
                <AnimatedNumber value={streak} decimals={0} />
              </h3>
              <p className="text-base" style={{ color: "#5B6572" }}>dias seguidos</p>
            </div>
            {/* Week timeline — only days where goal was reached are dark blue */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
              {weekTimeline.map((d, i) => (
                <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors"
                  style={{
                    backgroundColor: d.reached ? "#257ca3" : "#e0e3e6",
                    color: d.reached ? "#ffffff" : "#71787c",
                    outline: d.isToday ? "2px solid #257ca3" : "none",
                    outlineOffset: "2px",
                  }}
                  title={d.isToday ? "Hoje" : undefined}>
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* Tip card horizontal at the bottom */}
      <div className="rounded-xl p-5 border shrink-0 transition-all duration-300 mt-4"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255,255,255,0.3)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
        }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(191,232,255,0.5)" }}>
                <span className="material-symbols-outlined" style={{ color: "#257ca3" }}>lightbulb</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 flex-1">
                <span className="text-sm font-bold shrink-0" style={{ color: "#191c1e" }}>
                  Dica de Hidratação:
                </span>
                <p className="text-sm text-left flex-1" style={{ color: "#5B6572", lineHeight: "1.5" }}>
                  {customTipText || HYDRATION_TIPS[tipIndex]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isDev && (
                <>
                  <button
                    onClick={() => setDevInputVisible(!devInputVisible)}
                    className={`hover:bg-[#bfe8ff]/50 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer ${
                      devInputVisible ? "text-[#0f76a0] bg-[#bfe8ff]/30" : "text-[#257ca3]"
                    }`}
                    title="Digitar frase de teste (Dev)"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => {
                      const giantText = "Esta é uma dica de hidratação experimental extremamente longa, projetada especificamente para testar o limite absoluto de quebra de layout no painel lateral direito do aplicativo Gole, contendo mais de duzentos caracteres para fins de testes de interface de usuário.";
                      setCustomTipText(giantText);
                    }}
                    className="text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
                    title="Inserir frase gigante de teste (Dev)"
                  >
                    <span className="material-symbols-outlined text-[20px]">text_fields</span>
                  </button>
                  <button
                    onClick={() => {
                      setCustomTipText("");
                      setTipIndex((prev) => (prev + 1) % HYDRATION_TIPS.length);
                    }}
                    className="text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
                    title={`Avançar dica (Dev: ${tipIndex + 1}/${HYDRATION_TIPS.length})`}
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Campo de input dev para digitar frase customizada na hora */}
          {isDev && devInputVisible && (
            <div className="flex gap-2 items-center pl-14 animate-fade-in">
              <input
                type="text"
                value={customTipText || HYDRATION_TIPS[tipIndex]}
                onChange={(e) => setCustomTipText(e.target.value)}
                placeholder="Escreva sua frase de teste dev..."
                className="flex-1 px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#257ca3] bg-white text-[#191c1e]"
                style={{ borderColor: "#e0e3e6" }}
              />
              <button
                onClick={() => {
                  setCustomTipText("");
                  setDevInputVisible(false);
                }}
                className="px-3 py-1.5 rounded-lg font-medium text-[10px] transition-colors cursor-pointer"
                style={{ backgroundColor: "#eceef1", color: "#5B6572" }}
              >
                Resetar
              </button>
            </div>
          )}
        </div>
      </div>

      </div>{/* end scrollable */}

      <DrinkHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <SetTotalModal
        open={setTotalOpen}
        currentMl={consumed}
        containerMl={settings?.recipiente_configurado ? settings.recipiente_capacidade_ml : undefined}
        containerName={
          settings?.recipiente_configurado
            ? settings.recipiente_capacidade_ml < 350
              ? "copo"
              : settings.recipiente_capacidade_ml >= 1800
              ? "garrafão"
              : "garrafa"
            : undefined
        }
        onClose={() => setSetTotalOpen(false)}
      />
    </div>
  );
}
