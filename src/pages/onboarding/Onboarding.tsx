import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { api } from "../../lib/api";

type Step = "welcome" | "weight" | "activity" | "climate" | "work_hours" | "recipiente_setup" | "result";

const ACTIVITIES = [
  { id: "sedentary", emoji: "🛋️", label: "Quase não me exercito", description: "Trabalho sentado, pouco movimento", bonus: "+0ml" },
  { id: "light", emoji: "🚶", label: "Faço atividades leves", description: "Caminhadas, tarefas domésticas", bonus: "+300ml" },
  { id: "moderate", emoji: "🏃", label: "Me exercito regularmente", description: "Academia, esportes 3-5x por semana", bonus: "+600ml" },
  { id: "active", emoji: "🏋️", label: "Tenho rotina muito ativa", description: "Treinos intensos ou trabalho físico", bonus: "+1000ml" },
];

const CLIMATES = [
  { id: "cold", icon: "ac_unit", label: "Frio", description: "Abaixo de 18°C", bonus: "+0ml" },
  { id: "temperate", icon: "partly_cloudy_day", label: "Equilibrado", description: "18°C - 28°C", bonus: "+200ml" },
  { id: "hot", icon: "light_mode", label: "Quente", description: "Acima de 28°C", bonus: "+500ml" },
];

const SLIDER_MIN_WEIGHT = 40;
const SLIDER_MAX_WEIGHT = 150;
const VALID_MIN_WEIGHT = 20;
const VALID_MAX_WEIGHT = 300;

const SLIDER_MIN_AGE = 12;
const SLIDER_MAX_AGE = 100;
const VALID_MIN_AGE = 5;
const VALID_MAX_AGE = 120;


function formatGoal(ml: number): string {
  return (ml / 1000).toFixed(2).replace(".", ",") + " L";
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 480; // 08:00 default
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const CopoSvg = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <path d="M33 30 L37.5 77.5 A 4 4 0 0 0 41.5 81.5 L58.5 81.5 A 4 4 0 0 0 62.5 77.5 L67 30 Z" fill="url(#water-grad)" />
    <ellipse cx="50" cy="30" rx="17" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    <path d="M30 20 L38 80 A 4 4 0 0 0 42 84 L58 84 A 4 4 0 0 0 62 80 L70 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad)" />
    <ellipse cx="50" cy="20" rx="20" ry="4.5" stroke="#257ca3" strokeWidth="4.5" fill="none" />
    <path d="M35 25 L40 76" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M65 25 L59 76" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const BottleSvg = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-bottle" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-bottle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <rect x="44" y="6" width="12" height="6" rx="1.5" fill="#257ca3" />
    <rect x="46" y="12" width="8" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    <path d="M34.5 38 L34.5 85.5 Q34.5 87.5 37.5 87.5 L62.5 87.5 Q65.5 87.5 65.5 85.5 L65.5 38 Z" fill="url(#water-grad-bottle)" />
    <ellipse cx="50" cy="38" rx="15.5" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    <path d="M36 24 L64 24 Q68 24 68 28 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 28 Q32 24 36 24 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-bottle)" />
    <path d="M36 28 L36 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 28 L64 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const SportsBottleSvg = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-sports" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-sports" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    {/* Cap Loop/Strap */}
    <path d="M46 6 Q38 6 38 12 Q38 18 46 18" stroke="#257ca3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M44 8 L56 8 L54 3 L46 3 Z" fill="#257ca3" />
    <rect x="46" y="8" width="8" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    
    {/* Water */}
    <path d="M36.5 40 L36.5 85.5 Q36.5 87.5 38.5 87.5 L61.5 87.5 Q63.5 87.5 63.5 85.5 L63.5 40 Z" fill="url(#water-grad-sports)" />
    <ellipse cx="50" cy="40" rx="13.5" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    
    {/* Grip Sleeve (Silicone band around the center) */}
    <rect x="34" y="48" width="32" height="22" rx="2" fill="#257ca3" opacity="0.85" />
    {/* Texture ridges on the sleeve */}
    <line x1="38" y1="53" x2="62" y2="53" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="59" x2="62" y2="59" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="65" x2="62" y2="65" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    
    {/* Glass Outer Body */}
    <path d="M38 20 L62 20 Q66 20 66 24 L66 86 Q66 90 62 90 L38 90 Q34 90 34 86 L34 24 Q34 20 38 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-sports)" />
    
    {/* Highlights running over the glass and sleeve */}
    <path d="M37.2 28 L37.2 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M62.8 28 L62.8 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const JugSvg = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-jug" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-jug" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <rect x="42" y="6" width="16" height="6" fill="#257ca3" />
    <rect x="44" y="12" width="12" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    <path d="M74 28 Q82 28 82 44 L82 68 Q82 84 74 84" stroke="#257ca3" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M28.5 28 L28.5 85.5 Q28.5 87.5 30.5 87.5 L69.5 87.5 Q71.5 87.5 71.5 85.5 L71.5 28 Z" fill="url(#water-grad-jug)" />
    <ellipse cx="50" cy="28" rx="21.5" ry="4" fill="#BFE8FF" opacity="0.8" />
    <path d="M30 20 L70 20 Q74 20 74 24 L74 86 Q74 90 70 90 L30 90 Q26 90 26 86 L26 24 Q26 20 30 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-jug)" />
    <path d="M30 24 L30 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M70 24 L70 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

function OnboardingShell({
  step,
  totalSteps = 5,
  children,
}: {
  step: number;
  totalSteps?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: "#f7f9fc" }}>
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[60px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(191,232,255,0.6) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(198,231,255,0.5) 0%, transparent 70%)" }} />

      {/* Unified header */}
      <header className="absolute top-0 left-0 w-full px-8 py-6 flex justify-between items-center z-20">
        <div className="text-2xl font-semibold tracking-tight" style={{ color: "#257ca3" }}>GOLE</div>
        {step > 0 ? (
          <div className="flex gap-2 items-center">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === step ? "32px" : "16px",
                  backgroundColor: i + 1 <= step ? "#257ca3" : "#e0e3e6",
                  boxShadow: i + 1 === step ? "0 2px 8px rgba(59,99,119,0.25)" : "none",
                }}
              />
            ))}
          </div>
        ) : (
          <div />
        )}
      </header>

      {children}
    </div>
  );
}

function StepFooter({
  onBack,
  onNext,
  nextLabel = "Próximo",
  nextDisabled = false,
  showBack = true,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-4 w-full max-w-md mx-auto">
      {showBack && (
        <button
          onClick={onBack}
          className="w-14 h-14 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white"
          style={{ color: "#5B6572", border: "1px solid #e0e3e6", backgroundColor: "rgba(255,255,255,0.5)" }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 h-14 px-12 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
          boxShadow: nextDisabled ? "none" : "0 8px 20px rgba(59,99,119,0.25)",
          opacity: nextDisabled ? 0.4 : 1,
          cursor: nextDisabled ? "not-allowed" : "pointer",
          letterSpacing: "0.02em",
        }}
      >
        {nextLabel}
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAppStore();

  const [step, setStep] = useState<Step>("welcome");
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState(25);
  const [activity, setActivity] = useState<string>("");
  const [climate, setClimate] = useState<string>("");
  const [recipienteConfigurado, setRecipienteConfigurado] = useState(false);
  const [recipienteCapacidade, setRecipienteCapacidade] = useState(500);
  const [goal, setGoal] = useState(2450);
  const [submitting, setSubmitting] = useState(false);

  const [weightInput, setWeightInput] = useState("70");
  const [ageInput, setAgeInput] = useState("25");
  const [workStartHour, setWorkStartHour] = useState("08:00");
  const [workEndHour, setWorkEndHour] = useState("18:00");

  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isEditingAge, setIsEditingAge] = useState(false);

  useEffect(() => {
    setWeightInput(weight.toString());
  }, [weight]);

  useEffect(() => {
    setAgeInput(age.toString());
  }, [age]);

  // Compute goal whenever inputs change
  useEffect(() => {
    if (activity && climate) {
      const cleanWVal = weightInput.replace(",", ".");
      const parsedWeight = parseFloat(cleanWVal);
      const activeWeight = !isNaN(parsedWeight) ? Math.min(VALID_MAX_WEIGHT, Math.max(VALID_MIN_WEIGHT, Math.round(parsedWeight))) : weight;

      api.calculateGoal(activeWeight, activity, climate).then(setGoal).catch(() => {});
    }
  }, [weightInput, activity, climate]);

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await completeOnboarding(
        weight,
        age,
        activity || "sedentary",
        climate || "temperate",
        recipienteConfigurado,
        recipienteCapacidade,
        workStartHour,
        workEndHour
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setSubmitting(false);
    }
  };

  /* ─── WELCOME ─── */
  if (step === "welcome") {
    return (
      <OnboardingShell step={0}>
        <main className="flex-grow flex flex-col justify-center items-center text-center py-12 px-8 z-10 my-auto">
          <div className="flex justify-center mb-8 animate-fade-in">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <path d="M50 15C50 15 25 45 25 65C25 78.8071 36.1929 90 50 90C63.8071 90 75 78.8071 75 65C75 45 50 15 50 15Z"
                fill="url(#welcome-grad)" />
              <path d="M50 25C50 25 32 48 32 65C32 74.9411 40.0589 83 50 83C59.9411 83 68 74.9411 68 65C68 48 50 25 50 25Z"
                fill="white" fillOpacity="0.2" />
              <defs>
                <linearGradient id="welcome-grad" x1="50" y1="15" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#BFE8FF" />
                  <stop offset="1" stopColor="#5ABEFF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="space-y-4 max-w-xl mb-12 animate-fade-in">
            <h1 className="text-5xl font-semibold leading-[1.1] tracking-[-0.04em]" style={{ color: "#2C3440" }}>
              Vamos calcular sua meta diária de hidratação
            </h1>
            <p className="text-lg" style={{ color: "#5B6572", lineHeight: "1.6" }}>
              Responder algumas perguntas rápidas ajuda a criar lembretes mais inteligentes e adequados.
            </p>
          </div>

          <button
            onClick={() => setStep("weight")}
            className="h-14 px-12 rounded-full text-white font-medium text-sm flex items-center gap-2 group transition-all duration-300 hover:-translate-y-0.5 max-w-[320px] w-full cursor-pointer"
            style={{
              background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
              boxShadow: "0 8px 20px rgba(59,99,119,0.25)",
              letterSpacing: "0.02em",
            }}
          >
            <span className="flex-1 text-center">Vamos lá!</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform duration-200">
              arrow_forward
            </span>
          </button>
        </main>
      </OnboardingShell>
    );
  }

  /* ─── WEIGHT & AGE (step 1/4) ─── */
  if (step === "weight") {
    return (
      <OnboardingShell step={1}>
        <main className="flex-grow flex flex-col pt-24 pb-16 px-8 z-10 w-full max-w-5xl mx-auto">
          {/* Título da Etapa (Altura Fixa no Topo) */}
          <div className="text-center mb-6 max-w-2xl w-full mx-auto animate-fade-in flex-none">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 1 de 4
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-3" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Seus dados básicos
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Clique sobre os números para digitar se preferir.
            </p>
          </div>

          {/* Conteúdo Principal (Centralizado Verticalmente) */}
          <div className="flex-grow my-auto w-full flex flex-col items-center justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 w-full max-w-5xl animate-fade-in">
              {/* Peso Card - Sem Caixa */}
              <div className="flex flex-col items-center w-full px-4">
                <span className="text-sm font-bold tracking-widest uppercase mb-4 text-[#5B6572]">Peso (kg)</span>
                
                <div className="flex items-center justify-center h-24 mb-3">
                  {isEditingWeight ? (
                    <input
                      type="number"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      onBlur={() => {
                        setIsEditingWeight(false);
                        const cleanVal = weightInput.replace(",", ".");
                        let parsed = parseFloat(cleanVal);
                        if (isNaN(parsed)) parsed = 70;
                        const finalVal = Math.min(VALID_MAX_WEIGHT, Math.max(VALID_MIN_WEIGHT, Math.round(parsed)));
                        setWeight(finalVal);
                        setWeightInput(finalVal.toString());
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="text-7xl font-bold text-center bg-transparent border-b-2 border-[#257ca3] w-36 focus:outline-none py-1"
                      style={{ color: "#257ca3" }}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingWeight(true)}
                      className="text-8xl font-extrabold cursor-pointer select-none hover:text-[#5ABEFF] transition-colors"
                      style={{ color: "#257ca3" }}
                    >
                      {weight}
                    </span>
                  )}
                </div>

                <input
                  type="range"
                  min={SLIDER_MIN_WEIGHT}
                  max={SLIDER_MAX_WEIGHT}
                  value={Math.min(SLIDER_MAX_WEIGHT, Math.max(SLIDER_MIN_WEIGHT, weight))}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeight(val);
                    setWeightInput(val.toString());
                  }}
                  className="w-full focus:outline-none mt-4"
                />
                <div className="flex justify-between w-full mt-2 px-1">
                  <span className="text-[11px] font-bold text-gray-400">{SLIDER_MIN_WEIGHT}kg</span>
                  <span className="text-[11px] font-bold text-gray-400">{SLIDER_MAX_WEIGHT}kg</span>
                </div>
              </div>

              {/* Idade Card - Sem Caixa */}
              <div className="flex flex-col items-center w-full px-4">
                <span className="text-sm font-bold tracking-widest uppercase mb-4 text-[#5B6572]">Idade (anos)</span>
                
                <div className="flex items-center justify-center h-24 mb-3">
                  {isEditingAge ? (
                    <input
                      type="number"
                      value={ageInput}
                      onChange={(e) => setAgeInput(e.target.value)}
                      onBlur={() => {
                        setIsEditingAge(false);
                        const cleanVal = ageInput.replace(",", ".");
                        let parsed = parseFloat(cleanVal);
                        if (isNaN(parsed)) parsed = 25;
                        const finalVal = Math.min(VALID_MAX_AGE, Math.max(VALID_MIN_AGE, Math.round(parsed)));
                        setAge(finalVal);
                        setAgeInput(finalVal.toString());
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="text-7xl font-bold text-center bg-transparent border-b-2 border-[#257ca3] w-36 focus:outline-none py-1"
                      style={{ color: "#257ca3" }}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingAge(true)}
                      className="text-8xl font-extrabold cursor-pointer select-none hover:text-[#5ABEFF] transition-colors"
                      style={{ color: "#257ca3" }}
                    >
                      {age}
                    </span>
                  )}
                </div>

                <input
                  type="range"
                  min={SLIDER_MIN_AGE}
                  max={SLIDER_MAX_AGE}
                  value={Math.min(SLIDER_MAX_AGE, Math.max(SLIDER_MIN_AGE, age))}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAge(val);
                    setAgeInput(val.toString());
                  }}
                  className="w-full focus:outline-none mt-4"
                />
                <div className="flex justify-between w-full mt-2 px-1">
                  <span className="text-[11px] font-bold text-gray-400">{SLIDER_MIN_AGE} anos</span>
                  <span className="text-[11px] font-bold text-gray-400">{SLIDER_MAX_AGE} anos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé (Fixo na Base) */}
          <div className="w-full flex-none">
            <StepFooter
              onBack={() => setStep("welcome")}
              onNext={() => setStep("activity")}
            />
          </div>
        </main>
      </OnboardingShell>
    );
  }

  /* ─── ACTIVITY (step 2/4) ─── */
  if (step === "activity") {
    return (
      <OnboardingShell step={2}>
        <main className="flex-grow flex flex-col pt-24 pb-16 px-8 z-10 w-full max-w-5xl mx-auto">
          {/* Título da Etapa (Altura Fixa no Topo) */}
          <div className="text-center mb-6 max-w-2xl w-full mx-auto animate-fade-in flex-none">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 2 de 4
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-3" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Qual é o seu nível de atividade física?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Isso ajuda a ajustar sua meta para compensar a perda de líquidos.
            </p>
          </div>

          {/* Conteúdo Principal (Centralizado Verticalmente) */}
          <div className="flex-grow my-auto w-full flex flex-col items-center justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fade-in">
              {ACTIVITIES.map((a) => {
                const isSelected = activity === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActivity(a.id)}
                    className="group relative rounded-2xl p-6 flex items-start gap-4 text-left transition-all duration-300 focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.7)",
                      border: `1px solid ${isSelected ? "#257ca3" : "rgba(255,255,255,0.6)"}`,
                      boxShadow: isSelected ? "0 12px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.02)",
                      transform: isSelected ? "translateY(-4px)" : "none",
                    }}
                  >
                    <span className="text-3xl">{a.emoji}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
                        {a.label}
                      </h3>
                      <p className="text-sm" style={{ color: "#5B6572" }}>{a.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rodapé (Fixo na Base) */}
          <div className="w-full flex-none">
            <StepFooter
              onBack={() => setStep("weight")}
              onNext={() => setStep("climate")}
              nextDisabled={!activity}
            />
          </div>
        </main>
      </OnboardingShell>
    );
  }

  /* ─── CLIMATE (step 3/4) ─── */
  if (step === "climate") {
    return (
      <OnboardingShell step={3}>
        <main className="flex-grow flex flex-col pt-24 pb-16 px-8 z-10 w-full max-w-5xl mx-auto">
          {/* Título da Etapa (Altura Fixa no Topo) */}
          <div className="text-center mb-6 max-w-2xl w-full mx-auto animate-fade-in flex-none">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 3 de 4
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-3" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Como é o clima onde você mora?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Isso nos ajuda a entender sua taxa de transpiração básica.
            </p>
          </div>

          {/* Conteúdo Principal (Centralizado Verticalmente) */}
          <div className="flex-grow my-auto w-full flex flex-col items-center justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-fade-in">
              {CLIMATES.map((c) => {
                const isSelected = climate === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setClimate(c.id)}
                    className="group relative rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center transition-all duration-300 focus:outline-none min-h-[200px] cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.7)",
                      border: `1px solid ${isSelected ? "#257ca3" : "rgba(255,255,255,0.6)"}`,
                      boxShadow: isSelected ? "0 12px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.02)",
                      transform: isSelected ? "translateY(-4px)" : "none",
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-105">
                      <span className="material-symbols-outlined text-[32px] transition-all duration-300"
                         style={{
                           color: isSelected ? "#257ca3" : "rgba(59,99,119,0.7)",
                           fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0",
                         }}>
                        {c.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
                        {c.label}
                      </h3>
                      <p className="text-sm" style={{ color: "#5B6572" }}>{c.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rodapé (Fixo na Base) */}
          <div className="w-full flex-none">
            <StepFooter
              onBack={() => setStep("activity")}
              onNext={() => setStep("work_hours")}
              nextDisabled={!climate}
            />
          </div>
        </main>
      </OnboardingShell>
    );
  }

  /* ─── WORK HOURS (step 4/5) ─── */
  if (step === "work_hours") {
    return (
      <OnboardingShell step={4}>
        <main className="flex-grow flex flex-col pt-24 pb-16 px-8 z-10 w-full max-w-5xl mx-auto">
          {/* Título da Etapa */}
          <div className="text-center mb-10 max-w-2xl w-full mx-auto animate-fade-in flex-none">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 4 de 5
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-3" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Seu horário no computador
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Defina o horário em que costuma usar o computador para enviarmos os lembretes.
            </p>
          </div>

          {/* Conteúdo Principal (Centralizado Verticalmente) */}
          <div className="flex-grow my-auto w-full flex flex-col items-center justify-center">
            <div className="flex flex-col md:flex-row gap-12 items-center justify-center w-full max-w-3xl animate-fade-in">
              {/* Card Início */}
              <div 
                className="flex-1 flex flex-col items-center p-8 rounded-[2rem] border transition-all duration-300 w-full max-w-[280px]"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255,255,255,0.8)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.02)",
                }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(191,232,255,0.4)" }}>
                  <span className="material-symbols-outlined text-[26px]" style={{ color: "#257ca3" }}>schedule</span>
                </div>
                <span className="text-xs font-bold tracking-widest uppercase mb-4 text-[#5B6572]">Início de uso</span>
                
                <input
                  type="time"
                  value={workStartHour}
                  onChange={(e) => setWorkStartHour(e.target.value)}
                  className="text-4xl font-extrabold text-center bg-transparent border-b-2 border-transparent hover:border-[#257ca3]/30 focus:border-[#257ca3] w-full focus:outline-none py-1 pb-2 cursor-pointer transition-colors"
                  style={{ color: "#257ca3" }}
                />

                <div className="w-full px-2 mt-6">
                  <input
                    type="range"
                    min={0}
                    max={1410}
                    step={30}
                    value={timeToMinutes(workStartHour)}
                    onChange={(e) => setWorkStartHour(formatMinutesToTime(Number(e.target.value)))}
                    className="w-full accent-[#257ca3] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between w-full mt-1.5 px-0.5">
                    <span className="text-[10px] font-semibold text-gray-400">00:00</span>
                    <span className="text-[10px] font-semibold text-gray-400">12:00</span>
                    <span className="text-[10px] font-semibold text-gray-400">23:30</span>
                  </div>
                </div>
              </div>

              <span className="text-lg font-bold text-gray-400 uppercase tracking-widest hidden md:inline">até</span>

              {/* Card Fim */}
              <div 
                className="flex-1 flex flex-col items-center p-8 rounded-[2rem] border transition-all duration-300 w-full max-w-[280px]"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255,255,255,0.8)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.02)",
                }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(191,232,255,0.4)" }}>
                  <span className="material-symbols-outlined text-[26px]" style={{ color: "#257ca3" }}>power_settings_new</span>
                </div>
                <span className="text-xs font-bold tracking-widest uppercase mb-4 text-[#5B6572]">Término de uso</span>
                
                <input
                  type="time"
                  value={workEndHour}
                  onChange={(e) => setWorkEndHour(e.target.value)}
                  className="text-4xl font-extrabold text-center bg-transparent border-b-2 border-transparent hover:border-[#257ca3]/30 focus:border-[#257ca3] w-full focus:outline-none py-1 pb-2 cursor-pointer transition-colors"
                  style={{ color: "#257ca3" }}
                />

                <div className="w-full px-2 mt-6">
                  <input
                    type="range"
                    min={0}
                    max={1440}
                    step={30}
                    value={timeToMinutes(workEndHour)}
                    onChange={(e) => setWorkEndHour(formatMinutesToTime(Number(e.target.value)))}
                    className="w-full accent-[#257ca3] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between w-full mt-1.5 px-0.5">
                    <span className="text-[10px] font-semibold text-gray-400">00:00</span>
                    <span className="text-[10px] font-semibold text-gray-400">12:00</span>
                    <span className="text-[10px] font-semibold text-gray-400">24:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé (Fixo na Base) */}
          <div className="w-full flex-none">
            <StepFooter
              onBack={() => setStep("climate")}
              onNext={() => setStep("recipiente_setup")}
            />
          </div>
        </main>
      </OnboardingShell>
    );
  }

  /* ─── RECIPIENTE SETUP ─── */
  if (step === "recipiente_setup") {
    let containerLabel = "Garrafa pequena";
    let svgComponent = <BottleSvg />;
    let containerSize = { width: "85px", height: "95px" };

    if (recipienteCapacidade < 350) {
      containerLabel = "Copo pequeno";
      svgComponent = <CopoSvg />;
      containerSize = { width: "70px", height: "70px" };
    } else if (recipienteCapacidade >= 350 && recipienteCapacidade < 600) {
      containerLabel = "Garrafa pequena";
      svgComponent = <BottleSvg />;
      containerSize = { width: "85px", height: "95px" };
    } else if (recipienteCapacidade >= 600 && recipienteCapacidade < 900) {
      containerLabel = "Garrafa média";
      svgComponent = <BottleSvg />;
      containerSize = { width: "95px", height: "110px" };
    } else if (recipienteCapacidade >= 900 && recipienteCapacidade < 1200) {
      containerLabel = "Garrafa grande";
      svgComponent = <BottleSvg />;
      containerSize = { width: "105px", height: "125px" };
    } else if (recipienteCapacidade >= 1200 && recipienteCapacidade < 1800) {
      containerLabel = "Garrafa esportiva";
      svgComponent = <SportsBottleSvg />;
      containerSize = { width: "115px", height: "140px" };
    } else {
      containerLabel = "Garrafão";
      svgComponent = <JugSvg />;
      containerSize = { width: "135px", height: "155px" };
    }

    return (
      <OnboardingShell step={5}>
        <main className="flex-grow flex flex-col pt-24 pb-16 px-8 z-10 w-full max-w-3xl mx-auto">
          {/* Título da Etapa (Altura Fixa no Topo) */}
          <div className="text-center mb-6 max-w-2xl w-full mx-auto animate-fade-in flex-none">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 5 de 5 (Opcional)
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-3" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Você costuma usar um recipiente principal?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Ajuda a transformar mililitros em medidas mais fáceis de visualizar.
            </p>
          </div>

          {/* Conteúdo Principal (Centralizado Verticalmente) */}
          <div className="flex-grow my-auto w-full flex flex-col items-center justify-center">
            <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
              <div className="flex flex-col items-center justify-center h-[180px] mb-8 w-full">
                <div style={containerSize} className="flex items-center justify-center transition-all duration-300">
                  {svgComponent}
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-semibold" style={{ color: "#257ca3" }}>{recipienteCapacidade}</span>
                  <span className="text-sm font-medium text-gray-400">ml</span>
                </div>
                <span className="text-sm font-medium mt-1" style={{ color: "#5B6572" }}>{containerLabel}</span>
              </div>

              <div className="w-full px-4">
                <input
                  type="range"
                  min={200}
                  max={2000}
                  step={50}
                  value={recipienteCapacidade}
                  onChange={(e) => setRecipienteCapacidade(Number(e.target.value))}
                  className="w-full focus:outline-none"
                />
                <div className="flex justify-between w-full mt-2 px-1">
                  <span className="text-xs font-semibold text-gray-400">200ml</span>
                  <span className="text-xs font-semibold text-gray-400">2000ml</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé (Fixo na Base) */}
          <div className="w-full flex-none">
            <div className="flex items-center justify-center gap-4 w-full max-w-md mx-auto">
              <button
                onClick={() => setStep("work_hours")}
                className="w-14 h-14 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white"
                style={{ color: "#5B6572", border: "1px solid #e0e3e6", backgroundColor: "rgba(255,255,255,0.5)" }}
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button
                onClick={() => {
                  setRecipienteConfigurado(false);
                  setStep("result");
                }}
                className="h-14 px-6 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50 border border-gray-200 cursor-pointer"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  color: "#5B6572"
                }}
              >
                Pular
              </button>
              <button
                onClick={() => {
                  setRecipienteConfigurado(true);
                  setStep("result");
                }}
                className="flex-1 h-14 px-8 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
                  boxShadow: "0 8px 20px rgba(59,99,119,0.25)",
                }}
              >
                Confirmar
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </OnboardingShell>
    );
  }

  /* ─── RESULT ─── */
  return (
    <OnboardingShell step={0}>
      <main className="flex-grow flex flex-col items-center justify-center py-12 px-8 z-10 my-auto overflow-y-auto">
        <div className="w-full max-w-[500px] flex flex-col items-center animate-fade-in my-auto">
          <div
            className="w-full rounded-[2rem] p-8 flex flex-col items-center text-center relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1"
              style={{ background: "linear-gradient(90deg, #257ca3, #006492, #0f76a0)" }} />

            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 relative"
              style={{ backgroundColor: "#bfe8ff" }}>
              <div className="absolute inset-0 rounded-full border-2 animate-ripple"
                style={{ borderColor: "#c0e8ff" }} />
              <span className="material-symbols-outlined text-[40px]"
                style={{ color: "#257ca3", fontVariationSettings: "'FILL' 1" }}>
                water_drop
              </span>
            </div>

            <h2 className="text-3xl font-semibold mb-2" style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
              Sua meta diária:
              <span className="block mt-1 text-5xl font-semibold tracking-[-0.04em]" style={{ color: "#006492" }}>
                {formatGoal(goal)}
              </span>
            </h2>

            {/* Elegant Summary of inputs */}
            <div className="w-full mt-6 pt-6 border-t flex flex-col gap-4 text-left mb-8" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5B6572] mb-1">
                Resumo dos seus dados (clique para editar):
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Peso e Idade */}
                <button 
                  onClick={() => setStep("weight")}
                  className="p-4 rounded-xl flex flex-col gap-1 text-left transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#257ca3]/20 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                >
                  <span className="text-[11px] font-semibold text-[#5B6572] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    Perfil
                  </span>
                  <span className="text-base font-semibold text-[#191c1e] mt-1">
                    {weight} kg • {age} anos
                  </span>
                </button>

                {/* Horário de Uso */}
                <button 
                  onClick={() => setStep("work_hours")}
                  className="p-4 rounded-xl flex flex-col gap-1 text-left transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#257ca3]/20 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                >
                  <span className="text-[11px] font-semibold text-[#5B6572] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Horário ativo
                  </span>
                  <span className="text-base font-semibold text-[#191c1e] mt-1">
                    {workStartHour} às {workEndHour}
                  </span>
                </button>

                {/* Atividade */}
                <button 
                  onClick={() => setStep("activity")}
                  className="p-4 rounded-xl flex flex-col gap-1 text-left transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#257ca3]/20 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                >
                  <span className="text-[11px] font-semibold text-[#5B6572] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">fitness_center</span>
                    Exercício
                  </span>
                  <span className="text-base font-semibold text-[#191c1e] mt-1 truncate">
                    {ACTIVITIES.find(a => a.id === activity)?.label || "Não informado"}
                  </span>
                </button>

                {/* Clima */}
                <button 
                  onClick={() => setStep("climate")}
                  className="p-4 rounded-xl flex flex-col gap-1 text-left transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#257ca3]/20 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                >
                  <span className="text-[11px] font-semibold text-[#5B6572] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">thermostat</span>
                    Clima
                  </span>
                  <span className="text-base font-semibold text-[#191c1e] mt-1 truncate">
                    {CLIMATES.find(c => c.id === climate)?.label || "Não informado"}
                  </span>
                </button>

                {/* Recipiente */}
                <button 
                  onClick={() => setStep("recipiente_setup")}
                  className="col-span-2 p-4 rounded-xl flex flex-col gap-1 text-left transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#257ca3]/20 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                >
                  <span className="text-[11px] font-semibold text-[#5B6572] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_drink</span>
                    Recipiente principal
                  </span>
                  <span className="text-base font-semibold text-[#191c1e] mt-1 truncate">
                    {recipienteConfigurado ? `${recipienteCapacidade} ml` : "Não definido"}
                  </span>
                </button>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={submitting}
              className="w-full h-14 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 group transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              style={{
                background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
                boxShadow: "0 8px 20px rgba(59,99,119,0.25)",
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "wait" : "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {submitting ? "Salvando..." : "Começar"}
              {!submitting && (
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setStep("recipiente_setup");
              }}
              className="mt-4 text-sm font-medium transition-colors hover:text-[#257ca3] cursor-pointer"
              style={{ color: "#5B6572" }}
            >
              ← Ajustar respostas
            </button>
          </div>
        </div>
      </main>
    </OnboardingShell>
  );
}
