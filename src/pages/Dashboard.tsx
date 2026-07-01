import { useEffect, useState, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../store/useAppStore";
import { WaterGlass } from "../components/ui/WaterGlass";
import { CircularProgress } from "../components/ui/CircularProgress";
import { DrinkHistoryModal } from "../components/ui/DrinkHistoryModal";
import { ReminderHistoryModal } from "../components/ui/ReminderHistoryModal";
import { SetTotalModal } from "../components/ui/SetTotalModal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { UndoChip } from "../components/ui/UndoChip";
import { api } from "../lib/api";
import { useIsDev } from "../lib/useIsDev";
import { Modal, ModalSecondaryButton } from "../components/ui/Modal";

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

function SuccessRateCircle({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.max(0, rate * 100));
  const radius = 24;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  let colorClass = "text-red-500";
  if (pct >= 80) {
    colorClass = "text-green-500";
  } else if (pct >= 50) {
    colorClass = "text-yellow-500";
  }

  return (
    <div className="flex flex-col items-center justify-center relative w-12 h-12 shrink-0">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(0,0,0,0.06)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={`${colorClass} transition-all duration-300`}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-[#191c1e]">{Math.round(pct)}%</span>
    </div>
  );
}



export function Dashboard() {
  const { todayStats, loadTodayStats, logDrink, settings, loadSettings, weekStats, loadWeekStats, drinkTick } = useAppStore();
  const [undoVisible, setUndoVisible] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);
  const [dashboardStyle, setDashboardStyle] = useState<"dashboard1" | "dashboard2">("dashboard1");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reminderHistoryOpen, setReminderHistoryOpen] = useState(false);
  const [setTotalOpen, setSetTotalOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDev = useIsDev();
  const [tipIndex, setTipIndex] = useState(new Date().getDate() % HYDRATION_TIPS.length);
  const [devInputVisible, setDevInputVisible] = useState(false);
  const [customTipText, setCustomTipText] = useState("");
  const [todayDrinks, setTodayDrinks] = useState<any[]>([]);
  const [drinkToDeleteBasic, setDrinkToDeleteBasic] = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);



  const loadSuccessRate = () => {
    api.getDailySuccessRate()
      .then(setSuccessRate)
      .catch((err) => console.error("Erro ao carregar taxa de sucesso diária:", err));
  };

  useEffect(() => {
    api.getTodayDrinks().then(setTodayDrinks).catch(() => {});
  }, [drinkTick, todayStats?.consumed_ml]);

  useEffect(() => {
    loadTodayStats();
    loadSettings();
    loadWeekStats();
    loadSuccessRate();
    const style = localStorage.getItem("dashboard_style");
    if (style === "dashboard2") {
      setDashboardStyle("dashboard2");
    } else {
      setDashboardStyle("dashboard1");
    }
    const interval = setInterval(() => {
      loadTodayStats();
      loadWeekStats();
      loadSuccessRate();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload week stats whenever a drink is logged (real-time goal indicator)
  useEffect(() => {
    loadWeekStats();
    loadSuccessRate();
  }, [drinkTick, todayStats?.consumed_ml]);

  // Listen to Tauri events for real-time updates
  useEffect(() => {
    const unlistenRefresh = listen("refresh_data", () => {
      loadTodayStats();
      loadWeekStats();
      loadSuccessRate();
    });
    const unlistenSchedule = listen("schedule_changed", () => {
      loadSuccessRate();
    });
    const unlistenStats = listen("stats_changed", () => {
      loadSuccessRate();
    });

    return () => {
      unlistenRefresh.then((fn) => fn());
      unlistenSchedule.then((fn) => fn());
      unlistenStats.then((fn) => fn());
    };
  }, []);

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

  const handleDeleteDrink = async (id: number) => {
    try {
      const stats = await api.deleteDrink(id);
      useAppStore.setState({ todayStats: stats });
    } catch (e) {
      console.error("Erro ao deletar gole:", e);
    }
  };

  const stats = todayStats;
  const isPro = settings?.app_mode === "pro";
  const goal = isPro && stats?.goal_expediente_ml ? stats.goal_expediente_ml : (stats?.goal_ml ?? 2500);
  const consumed = stats?.consumed_ml ?? 0;
  const percent = goal > 0 ? (consumed / goal) * 100 : 0;
  const remaining = Math.max(0, goal - consumed);
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

  const isBasicMode = settings?.app_mode === "basic";

  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const parts = isoString.split("T");
      if (parts.length === 2) {
        const timeParts = parts[1].split(":");
        if (timeParts.length >= 2) {
          return `${timeParts[0]}:${timeParts[1]}`;
        }
      }
    } catch (e) {}
    return "--:--";
  };

  if (isBasicMode) {
    const nextTime = formatTime(stats?.next_reminder_at);
    const timesDrunk = todayDrinks.length;
    const confirmedReminders = stats?.reminders_confirmed ?? 0;
    const totalSent = stats?.reminders_sent ?? 0;
    const ignoredReminders = Math.max(0, totalSent - confirmedReminders);

    return (
      <div className="flex flex-col h-full" style={{ marginLeft: "280px" }}>
        {/* Header */}
        <header className="flex justify-between items-end px-10 pt-10 pb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-medium mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
              Hidratação Ativa
            </h2>
            <p className="text-base" style={{ color: "#5B6572" }}>
              Lembretes simples ativos. Sem metas ou contagens complexas.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#257ca3" }}>Hoje</p>
            <p className="text-base font-medium" style={{ color: "#191c1e" }}>{formatDate()}</p>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-10 pb-6">
          <div className="flex flex-col gap-4 justify-center items-center my-0 max-w-2xl mx-auto w-full pt-2">
            {/* Card Principal de Ação */}
            <div className="bg-white rounded-[2rem] p-6 border border-white/20 w-full flex flex-col items-center relative overflow-hidden"
              style={{
                boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(20px)"
              }}>
              
              <div className="absolute top-0 left-0 w-full h-1"
                style={{ background: "linear-gradient(90deg, #257ca3, #0f76a0)" }} />

              {/* Seção do Botão Principal (Destaque) */}
              <div className="flex flex-col items-center mb-6 relative">
                {/* Próximo Alerta Pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#257ca3]/10 border border-[#257ca3]/20 mb-4 shrink-0">
                  <span className="material-symbols-outlined text-[14px] text-[#257ca3]">alarm</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#257ca3]">
                    Próximo Alerta: {nextTime !== "--:--" ? nextTime : "Agendando..."}
                  </span>
                </div>

                {/* Botão de Registro Rápido: Grande, Minimalista e Evidenciado */}
                <button
                  onClick={() => handleLogDrink(drinkAmount)}
                  className="w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1 text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative group focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-4"
                  style={{
                    background: "linear-gradient(135deg, #257ca3 0%, #0f76a0 100%)",
                    boxShadow: "0 12px 30px rgba(37,124,163,0.3)"
                  }}
                >
                  <div className="absolute inset-0 rounded-full border border-white/20 scale-90 group-hover:scale-95 transition-transform duration-300" />
                  <span className="material-symbols-outlined text-[40px]">water_drop</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase">Bebi Água</span>
                </button>

                {/* Undo Action */}
                <div className="h-8 mt-2 flex items-center justify-center shrink-0">
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

              {/* Grid de Duas Colunas (Lembretes e Lista de Goles) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-t pt-5"
                   style={{ borderColor: "rgba(44,52,64,0.06)" }}>
                
                {/* Coluna Esquerda: Lembretes */}
                <div 
                  onClick={() => setReminderHistoryOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setReminderHistoryOpen(true);
                    }
                  }}
                  tabIndex={0}
                  className="bg-gray-50/50 border border-gray-100/50 rounded-2xl p-4 flex items-center justify-between w-full gap-4 text-left cursor-pointer hover:bg-gray-100/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                  title="Clique para ver o histórico de lembretes"
                >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="material-symbols-outlined text-[18px] text-[#257ca3]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#5B6572]">Lembretes</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Confirmados: <strong className="text-[#257ca3]">{confirmedReminders}</strong>
                      </span>
                      <span className="text-xs text-[#5B6572] font-medium">
                        Ignorados: <strong>{ignoredReminders}</strong>
                      </span>
                    </div>
                  </div>
                  {successRate !== null && (
                    <div className="flex flex-col items-center shrink-0">
                      <SuccessRateCircle rate={successRate} />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#5B6572] mt-1">Sucesso</span>
                    </div>
                  )}
                </div>

                {/* Coluna Direita: Água Bebida */}
                <div className="bg-gray-50/50 border border-gray-100/50 rounded-2xl p-4 flex flex-col items-stretch text-left self-stretch max-h-[160px]">
                  <div className="flex items-center gap-1.5 mb-2 shrink-0 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px] text-[#257ca3]" style={{ fontVariationSettings: "'FILL' 1" }}>local_drink</span>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#5B6572]">Água Bebida ({timesDrunk})</span>
                    </div>
                    {todayDrinks.length > 0 && (
                      <button
                        onClick={() => setHistoryOpen(true)}
                        className="text-[10px] font-semibold text-[#257ca3] hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 rounded-sm"
                        title="Ver todo o histórico"
                      >
                        Ver todos
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-1.5 custom-scrollbar min-h-[50px]">
                    {todayDrinks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[50px] text-center text-[10px] text-[#71787c] font-medium leading-normal">
                        Nenhum registro hoje.<br/>Beba água para começar!
                      </div>
                    ) : (
                      todayDrinks.slice(0, 2).map((drink) => (
                        <div key={drink.id} 
                             className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-gray-150/30 hover:bg-gray-100/30 transition-all duration-200">
                          <div className="flex items-center gap-2 pl-1">
                            <span className="material-symbols-outlined text-[#257ca3] text-[14px]">water_drop</span>
                            <span className="text-xs font-semibold text-[#191c1e]">{drink.amount_ml}ml</span>
                            <span className="text-[10px] text-[#71787c]">{formatTime(drink.logged_at)}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrinkToDeleteBasic(drink.id);
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d32f2f] focus:ring-offset-2"
                            title="Remover este registro"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>

            {drinkToDeleteBasic !== null && (
              <Modal
                open={true}
                onClose={() => setDrinkToDeleteBasic(null)}
                title="Confirmar Exclusão"
                description="Deseja realmente excluir este registro de água? Isso atualizará seu total diário."
                icon="warning"
                iconColor="#bf360c"
                iconBg="#ffe0b2"
                maxWidth={380}
              >
                <div className="flex gap-3 mt-2">
                  <ModalSecondaryButton onClick={() => setDrinkToDeleteBasic(null)}>
                    Cancelar
                  </ModalSecondaryButton>
                  <button
                    onClick={async () => {
                      const id = drinkToDeleteBasic;
                      setDrinkToDeleteBasic(null);
                      await handleDeleteDrink(id);
                    }}
                    className="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d32f2f] focus:ring-offset-2"
                    style={{
                      background: "linear-gradient(180deg, #d32f2f 0%, #c62828 100%)",
                      boxShadow: "0 8px 20px rgba(211,47,47,0.25)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </Modal>
            )}



            {/* Tips horizontal Card */}
            <div className="rounded-2xl p-5 border transition-all duration-300 w-full"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(20px)",
                borderColor: "rgba(255,255,255,0.3)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
              }}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ color: "#257ca3", fontVariationSettings: "'FILL' 1" }}>
                      lightbulb
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#5B6572]">
                      Dica de Hidratação
                    </span>
                  </div>
                  <button
                    onClick={() => setTipIndex((prev) => (prev + 1) % HYDRATION_TIPS.length)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer text-[#5B6572] focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
                    title="Nova dica"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-[#191c1e] font-medium">
                  "{HYDRATION_TIPS[tipIndex]}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modais compartilhados */}
        <DrinkHistoryModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
        <ReminderHistoryModal
          open={reminderHistoryOpen}
          onClose={() => setReminderHistoryOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ marginLeft: "280px" }}>
      {/* Fixed header */}
      <header className="flex justify-between items-end px-8 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-medium mb-0.5" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
            Resumo Diário
          </h2>
          <p className="text-xs" style={{ color: "#5B6572" }}>
            Acompanhe seu fluxo de hidratação de hoje.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider leading-none" style={{ color: "#257ca3" }}>Hoje</p>
          <p className="text-xs font-medium mt-1" style={{ color: "#191c1e" }}>{formatDate()}</p>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col px-8 pb-4 overflow-y-auto min-h-0">
        {settings?.app_mode === "pro" && stats?.goal_expediente_ml !== undefined && (
          <div className="mt-1 mb-2 bg-[#e0f2fe]/40 border border-[#bfe8ff]/80 rounded-xl p-2.5 flex gap-2.5 items-center">
            <span className="material-symbols-outlined text-[24px] text-[#006492] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              info
            </span>
            <div className="text-xs text-[#004f74] leading-relaxed">
              Sua meta diária ideal é de <strong className="text-[#003853]">{formatMl(stats.goal_ml)}</strong>. 
              Como o aplicativo monitora o seu expediente no computador, os lembretes ativos ajudarão você a consumir a meta proporcional de <strong className="text-[#003853]">{formatMl(stats.goal_expediente_ml)}</strong> enquanto estiver ativo no PC. 
              O restante de <strong className="text-[#003853]">{formatMl(stats.goal_fora_expediente_ml ?? 0)}</strong> deve ser consumido naturalmente fora do horário do computador.
            </div>
          </div>
        )}
        {dashboardStyle === "dashboard1" ? (
          <>
            <div className="grid grid-cols-12 gap-3 mt-1 flex-grow min-h-0">
          {/* Left Side: Cards grid (7 columns) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-between self-stretch gap-3 min-h-0">
          
          {/* Row 1: Consumed & Remaining */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
            {/* Consumed card */}
            <div className="bg-white rounded-xl p-4 border border-white/20 group hover:border-[#006492] transition-colors duration-300 relative overflow-hidden flex flex-col justify-between"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Consumido
                    </p>
                    <button
                      onClick={() => setHistoryOpen(true)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer focus:outline-none"
                      title="Editar registros de hoje"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => setSetTotalOpen(true)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer focus:outline-none"
                      title="Definir total bebido hoje"
                    >
                      <span className="material-symbols-outlined text-[16px]">tune</span>
                    </button>
                  </div>
                  <h3 className="text-4xl font-semibold leading-none cursor-pointer focus:outline-none" style={{ color: "#257ca3", letterSpacing: "-0.04em" }}
                    onClick={() => setHistoryOpen(true)}
                    title="Editar registros de hoje">
                    {consumed >= 1000 ? (consumed / 1000).toFixed(2).replace(".", ",") : consumed}
                    <span className="text-xl font-medium text-gray-500">
                      {consumed >= 1000 ? "L" : "ml"}
                    </span>
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
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
                    <span className="material-symbols-outlined text-[18px]" style={{ color: "#257ca3" }}>local_drink</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <CircularProgress percent={percent} size={48} />
                <div className="text-xs text-gray-500 leading-tight">
                  da sua meta de <strong className="text-gray-800">{formatMl(goal)}</strong>
                  {settings?.recipiente_configurado && (
                    <span className="block text-[10px] mt-0.5 font-medium text-[#257ca3]">
                      {getContainerGoalText()}
                    </span>
                  )}
                  {settings?.app_mode === "pro" && stats?.goal_expediente_ml !== undefined && stats?.goal_fora_expediente_ml !== undefined && (
                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex flex-col gap-0.5 text-[9px] text-gray-400 font-medium leading-none">
                      <div className="flex justify-between gap-3">
                        <span>💻 No PC:</span>
                        <strong className="text-gray-600">{formatMl(stats.goal_expediente_ml)}</strong>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>🏡 Fora do PC:</span>
                        <strong className="text-gray-600">{formatMl(stats.goal_fora_expediente_ml)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Remaining card */}
            <div className="bg-white rounded-xl p-4 border border-white/20 group hover:border-[#006492] transition-colors duration-300 flex flex-col justify-between"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Restante</p>
                  <h3 className="text-4xl font-semibold leading-none text-gray-800" style={{ letterSpacing: "-0.02em" }}>
                    <AnimatedNumber
                      value={remaining}
                      format={(n) => remaining >= 1000 ? (n / 1000).toFixed(2).replace(".", ",") : String(Math.round(n))}
                    />
                    <span className="text-xl font-medium text-gray-500">
                      {remaining >= 1000 ? "L" : "ml"}
                    </span>
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(224,242,254,0.5)" }}>
                  <span className="material-symbols-outlined text-[18px] text-[#0284c7]">schedule</span>
                </div>
              </div>
              <div className="mt-4 pt-1.5 border-t border-gray-100 flex justify-between items-center gap-3 text-xs text-gray-500 leading-tight">
                <span>
                  {settings?.app_mode === "pro" 
                    ? "faltam para atingir a meta no PC." 
                    : "faltam para atingir o objetivo diário."}
                </span>
                {stats?.next_reminder_at && (
                  <div className="flex items-center gap-1 bg-[#257ca3]/10 border border-[#257ca3]/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-[#257ca3] uppercase tracking-wider shrink-0" title="Próximo lembrete">
                    <span className="material-symbols-outlined text-[12px]">alarm</span>
                    {formatTime(stats.next_reminder_at)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Streak */}
          <div className="w-full flex-1 min-h-0">
            {/* Streak */}
            <div className="bg-white rounded-xl p-4 border border-white/20 group hover:border-[#006492] transition-colors duration-300 flex flex-col justify-between h-full"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(201,230,255,0.5)" }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: "#006492" }}>local_fire_department</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-500">Streak Atual</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-4xl font-semibold leading-none text-gray-800" style={{ letterSpacing: "-0.04em" }}>
                    <AnimatedNumber value={streak} decimals={0} />
                  </h3>
                  <p className="text-xs text-gray-500">dias seguidos</p>
                </div>
              </div>
              {/* Week timeline */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
                {weekTimeline.map((d, i) => (
                  <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold transition-colors"
                    style={{
                      backgroundColor: d.reached ? "#257ca3" : "#e0e3e6",
                      color: d.reached ? "#ffffff" : "#71787c",
                      outline: d.isToday ? "2px solid #257ca3" : "none",
                      outlineOffset: "1px",
                    }}
                    title={d.isToday ? "Hoje" : undefined}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Quick Action & Daily Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
            {/* Quick action */}
            <button
              onClick={() => handleLogDrink(drinkAmount)}
              className="rounded-xl p-4 flex items-center justify-between group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer focus:outline-none flex flex-col justify-between text-left h-full"
              style={{ background: "linear-gradient(135deg, #257ca3 0%, #0f76a0 100%)", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}
            >
              <div className="w-full flex justify-between items-start mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#bfe8ff]">
                  Registro Rápido
                </p>
                <div className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors group-hover:bg-white/30"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <span className="material-symbols-outlined text-white text-[16px]">add</span>
                </div>
              </div>
              <h3 className="text-lg font-medium text-white leading-tight" style={{ letterSpacing: "-0.01em" }}>
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
            </button>

            {/* Missão Diária */}
            {settings?.app_mode === "pro" && todayStats?.daily_mission ? (
              <div className="bg-white rounded-xl p-4 border border-white/20 group hover:border-[#006492] transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full"
                style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: todayStats.daily_mission.is_completed ? "#dcfce7" : "rgba(201,230,255,0.5)" }}>
                    <span className="material-symbols-outlined transition-all duration-300 text-[16px]"
                      style={{
                        color: todayStats.daily_mission.is_completed ? "#16a34a" : "#006492",
                        fontVariationSettings: todayStats.daily_mission.is_completed ? "'FILL' 1" : "'FILL' 0"
                      }}>
                      {todayStats.daily_mission.is_completed ? "task_alt" : "target"}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Missão Diária</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className={`text-xs font-semibold leading-tight transition-all duration-300 text-left line-clamp-2 ${
                    todayStats.daily_mission.is_completed ? "line-through text-gray-400" : "text-gray-800"
                  }`}>
                    {todayStats.daily_mission.description}
                  </p>

                  <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        todayStats.daily_mission.is_completed ? "bg-green-500" : "bg-[#257ca3]"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (todayStats.daily_mission.current_ml / todayStats.daily_mission.target_ml) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>
                      {todayStats.daily_mission.current_ml}ml / {todayStats.daily_mission.target_ml}ml
                    </span>
                    {todayStats.daily_mission.is_completed ? (
                      <span className="text-green-600 font-bold">Completada!</span>
                    ) : (
                      <span>Em progresso</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 border border-white/20 group hover:border-[#006492] transition-colors duration-300 flex flex-col justify-between h-full"
                style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(236,238,241,0.5)" }}>
                    <span className="material-symbols-outlined text-[18px] text-gray-400">target</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-500">Missão Diária</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-tight italic">
                  Nenhuma missão ativa. Complete no Modo Pro.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Water Glass (5 columns) */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-white/20 p-4 flex flex-col justify-between items-center self-stretch"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
          <div className="text-center w-full">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Nível de Hidratação</p>
            <h3 className="text-3xl font-semibold mt-1 text-[#257ca3]">{Math.round(percent)}%</h3>
          </div>
          <div className="flex-1 flex items-center justify-center relative min-h-[280px] w-full py-4">
            <WaterGlass percent={percent} className="min-h-[280px]" />
          </div>
          
          {undoVisible ? (
            <div className="w-full shrink-0 animate-fade-in mt-2">
              <UndoChip
                key={lastAmount + "-dash"}
                amount={lastAmount}
                onUndo={handleUndo}
                onExpire={() => setUndoVisible(false)}
              />
            </div>
          ) : (
            <div className="w-full shrink-0 flex items-center justify-center mt-2 border-t pt-3" style={{ borderColor: "rgba(44,52,64,0.06)" }}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span>Registro rápido atualiza a gota em tempo real</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tip card horizontal at the bottom */}
      <div className="rounded-xl p-4 border shrink-0 transition-all duration-300 mt-4"
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
                    className={`hover:bg-[#bfe8ff]/50 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 ${
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
                    className="text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
                    title="Inserir frase gigante de teste (Dev)"
                  >
                    <span className="material-symbols-outlined text-[20px]">text_fields</span>
                  </button>
                  <button
                    onClick={() => {
                      setCustomTipText("");
                      setTipIndex((prev) => (prev + 1) % HYDRATION_TIPS.length);
                    }}
                    className="text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
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
                className="flex-1 px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 bg-white text-[#191c1e]"
                style={{ borderColor: "#e0e3e6" }}
              />
              <button
                onClick={() => {
                  setCustomTipText("");
                  setDevInputVisible(false);
                }}
                className="px-3 py-1.5 rounded-lg font-medium text-[10px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                style={{ backgroundColor: "#eceef1", color: "#5B6572" }}
              >
                Resetar
              </button>
            </div>
          )}
        </div>
      </div>
          </>
        ) : (
          <>
            {/* DASHBOARD 2 (Novo / Compacto / Criativo) */}
            <div className="grid grid-cols-12 gap-3 mt-1 flex-grow min-h-0">
              
              {/* Left Side (8 columns) */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-3 self-stretch min-h-0 justify-between">
                
                {/* Row 1: Consumido, Restante & Botão de Registro Rápido */}
                <div className="bg-white rounded-xl p-4 border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-1 min-h-0"
                  style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                  
                  <div className="flex-1 grid grid-cols-2 gap-4 divide-x divide-gray-100 h-full items-center">
                    {/* Consumido */}
                    <div className="flex flex-col justify-center h-full group">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Consumido</p>
                        <button
                          onClick={() => setHistoryOpen(true)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer focus:outline-none"
                          title="Editar registros de hoje"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                        </button>
                        <button
                          onClick={() => setSetTotalOpen(true)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity text-[#257ca3] hover:bg-[#bfe8ff]/50 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer focus:outline-none"
                          title="Definir total bebido hoje"
                        >
                          <span className="material-symbols-outlined text-[13px]">tune</span>
                        </button>
                      </div>
                      <h3 className="text-3xl font-semibold text-gray-800 tracking-tight leading-none cursor-pointer focus:outline-none"
                        onClick={() => setHistoryOpen(true)}
                        title="Editar registros de hoje">
                        <AnimatedNumber value={consumed} />
                        <span className="text-lg font-medium text-gray-400 ml-1">ml</span>
                      </h3>
                      {settings?.app_mode === "pro" && stats?.goal_expediente_ml && (
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-none">
                          da meta de <strong>{stats.goal_expediente_ml}ml</strong> no PC
                        </p>
                      )}
                    </div>

                    {/* Restante */}
                    <div className="pl-4 flex flex-col justify-center h-full">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Restante</p>
                      <h3 className="text-3xl font-semibold text-gray-800 tracking-tight leading-none">
                        <AnimatedNumber value={remaining} />
                        <span className="text-lg font-medium text-gray-400 ml-1">ml</span>
                      </h3>
                      {stats?.next_reminder_at && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#257ca3] font-bold uppercase tracking-wider leading-none">
                          <span className="material-symbols-outlined text-[13px]">alarm</span>
                          <span>Lembrete: {formatTime(stats.next_reminder_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão de Registro Rápido (Tamanho Normal) */}
                  <div className="flex items-center justify-center shrink-0">
                    <button
                      onClick={() => handleLogDrink(drinkAmount)}
                      className="px-5 py-3 bg-gradient-to-r from-[#257ca3] to-[#0f76a0] hover:from-[#1e6687] hover:to-[#0c5d7f] text-white text-xs font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3]"
                    >
                      <span className="material-symbols-outlined text-[16px]">water_drop</span>
                      <span>
                        {settings?.recipiente_configurado ? (
                          `Beber ${
                            settings.recipiente_capacidade_ml < 350
                              ? "Copo"
                              : settings.recipiente_capacidade_ml >= 1800
                              ? "Garrafão"
                              : "Garrafa"
                          } (+${drinkAmount}ml)`
                        ) : (
                          `Beber +${drinkAmount}ml`
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Missão Diária & Streak (Lado a Lado) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-[1.2] min-h-0">
                  {/* Missão Diária */}
                  {settings?.app_mode === "pro" && todayStats?.daily_mission ? (
                    <div className="bg-white rounded-xl p-4 border border-white/20 flex flex-col justify-between h-full"
                      style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300"
                        style={{ backgroundColor: todayStats.daily_mission.is_completed ? "#dcfce7" : "rgba(201,230,255,0.5)" }}>
                        <span className="material-symbols-outlined transition-all duration-300 text-[14px]"
                          style={{
                            color: todayStats.daily_mission.is_completed ? "#16a34a" : "#006492",
                            fontVariationSettings: todayStats.daily_mission.is_completed ? "'FILL' 1" : "'FILL' 0"
                          }}>
                          {todayStats.daily_mission.is_completed ? "task_alt" : "target"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Missão Diária</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold leading-tight text-gray-700 text-left line-clamp-2">
                        {todayStats.daily_mission.description}
                      </p>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (todayStats.daily_mission.current_ml / todayStats.daily_mission.target_ml) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                        <span>{todayStats.daily_mission.current_ml}ml / {todayStats.daily_mission.target_ml}ml</span>
                        {todayStats.daily_mission.is_completed ? (
                          <span className="text-green-600 font-bold">Completada!</span>
                        ) : (
                          <span>Em progresso</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4 border border-white/20 group hover:border-[#006492] transition-colors duration-300 flex flex-col justify-between h-full"
                    style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(236,238,241,0.5)" }}>
                        <span className="material-symbols-outlined text-[14px] text-gray-400">target</span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Missão Diária</p>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight italic">
                      Nenhuma missão ativa. Complete no Modo Pro.
                    </p>
                  </div>
                )}

                {/* Streak */}
                <div className="bg-white rounded-xl p-4 border border-white/20 group hover:border-[#006492] transition-colors duration-300 flex flex-col justify-between h-full"
                  style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(201,230,255,0.5)" }}>
                      <span className="material-symbols-outlined text-[14px]" style={{ color: "#006492" }}>local_fire_department</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Streak Atual</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-semibold text-gray-800 tracking-tight leading-none">
                      <AnimatedNumber value={streak} decimals={0} />
                    </h3>
                    <p className="text-[10px] text-gray-500">dias seguidos</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                    {weekTimeline.map((d, i) => (
                      <div key={i} className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-colors"
                        style={{
                          backgroundColor: d.reached ? "#257ca3" : "#e0e3e6",
                          color: d.reached ? "#ffffff" : "#71787c",
                          outline: d.isToday ? "2px solid #257ca3" : "none",
                          outlineOffset: "1px",
                        }}
                        title={d.isToday ? "Hoje" : undefined}>
                        {d.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Dica de Hidratação Integrada */}
              <div className="bg-[#f0f9ff]/50 border border-[#bae6fd]/50 rounded-xl p-3 flex gap-3 items-center shrink-0"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(191,232,255,0.5)" }}>
                  <span className="material-symbols-outlined text-[15px] text-[#257ca3]">lightbulb</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-left">
                  <span className="text-xs font-bold text-[#0369a1] shrink-0">Dica de Hidratação:</span>
                  <p className="text-xs text-[#0369a1] leading-tight line-clamp-1">
                    {customTipText || HYDRATION_TIPS[tipIndex]}
                  </p>
                </div>
              </div>

            </div>

            {/* Right Side (4 columns): Copo de Água */}
            <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-white/20 p-4 flex flex-col justify-between items-center self-stretch"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              <div className="text-center w-full">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Nível de Hidratação</p>
                <h3 className="text-2xl font-semibold mt-1 text-[#257ca3]">{Math.round(percent)}%</h3>
              </div>
              <div className="flex-grow flex items-center justify-center relative min-h-[220px] w-full py-2">
                <WaterGlass percent={percent} className="min-h-[220px]" />
              </div>
              
              {undoVisible ? (
                <div className="w-full shrink-0 animate-fade-in mt-2">
                  <UndoChip
                    key={lastAmount + "-dash"}
                    amount={lastAmount}
                    onUndo={handleUndo}
                    onExpire={() => setUndoVisible(false)}
                  />
                </div>
              ) : (
                <div className="w-full shrink-0 flex items-center justify-center mt-2 border-t pt-2" style={{ borderColor: "rgba(44,52,64,0.06)" }}>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">info</span>
                    <span>Registro atualiza a gota em tempo real</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}

      </div>{/* end scrollable */}

      <DrinkHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <ReminderHistoryModal open={reminderHistoryOpen} onClose={() => setReminderHistoryOpen(false)} />
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
