import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { api } from "../../lib/api";

type Step = "welcome" | "weight" | "activity" | "climate" | "recipiente_setup" | "result";

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

const MIN_WEIGHT = 40;
const MAX_WEIGHT = 150;

function clampWeight(value: number): number {
  if (isNaN(value)) return 70;
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(value)));
}

function formatGoal(ml: number): string {
  return (ml / 1000).toFixed(2).replace(".", ",") + " L";
}

const CopoSvg = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
    <path d="M30 20 L38 80 A 4 4 0 0 0 42 84 L58 84 A 4 4 0 0 0 62 80 L70 20 Z" stroke="#3b6377" strokeWidth="4" strokeLinejoin="round" fill="rgba(191,232,255,0.2)" />
    <path d="M33 35 L37 78 L63 78 L67 35 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

const BottleSvg = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
    <rect x="44" y="8" width="12" height="6" rx="1.5" fill="#3b6377" />
    <rect x="46" y="14" width="8" height="10" fill="#e0e3e6" stroke="#3b6377" strokeWidth="3" />
    <path d="M36 24 L64 24 Q68 24 68 28 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 28 Q32 24 36 24 Z" stroke="#3b6377" strokeWidth="4" fill="rgba(191,232,255,0.2)" />
    <path d="M34 40 L66 40 L66 86 Q66 88 64 88 L36 88 Q34 88 34 86 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

const SportsBottleSvg = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
    <path d="M42 12 L58 12 L56 7 L44 7 Z" fill="#3b6377" />
    <rect x="46" y="12" width="8" height="8" fill="#e0e3e6" stroke="#3b6377" strokeWidth="3" />
    <path d="M36 20 L64 20 Q68 20 68 24 L66 40 L68 44 L66 48 L68 52 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 52 L34 48 L32 44 L34 40 Z" stroke="#3b6377" strokeWidth="4" fill="rgba(191,232,255,0.2)" />
    <path d="M34 40 L66 40 L66 86 Q66 88 64 88 L36 88 Q34 88 34 86 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

const JugSvg = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
    <rect x="42" y="8" width="16" height="6" fill="#3b6377" />
    <rect x="44" y="14" width="12" height="8" fill="#e0e3e6" stroke="#3b6377" strokeWidth="3" />
    <path d="M26 30 L74 30 Q78 30 78 34 L78 86 Q78 90 74 90 L26 90 Q22 90 22 86 L22 34 Q22 30 26 30 Z" stroke="#3b6377" strokeWidth="4" fill="rgba(191,232,255,0.2)" />
    <path d="M78 40 L84 40 L84 62 L78 62" stroke="#3b6377" strokeWidth="4" strokeLinecap="round" />
    <path d="M24 45 L76 45 L76 86 Q76 88 74 88 L26 88 Q24 88 24 86 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

function OnboardingShell({
  step,
  totalSteps = 4,
  children,
}: {
  step: number;
  totalSteps?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: "#f7f9fc" }}>
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[60px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(191,232,255,0.6) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(198,231,255,0.5) 0%, transparent 70%)" }} />

      {/* Unified header */}
      <header className="w-full px-8 py-6 flex justify-between items-center z-10 relative">
        <div className="text-2xl font-semibold tracking-tight" style={{ color: "#3b6377" }}>GOLE</div>
        {step > 0 ? (
          <div className="flex gap-2 items-center">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === step ? "32px" : "16px",
                  backgroundColor: i + 1 <= step ? "#3b6377" : "#e0e3e6",
                  boxShadow: i + 1 === step ? "0 2px 8px rgba(59,99,119,0.2)" : "none",
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
        className="flex-1 px-12 py-4 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
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
  const [recipienteCapacidadeInput, setRecipienteCapacidadeInput] = useState("500");

  useEffect(() => {
    setWeightInput(weight.toString());
  }, [weight]);

  useEffect(() => {
    setAgeInput(age.toString());
  }, [age]);

  useEffect(() => {
    setRecipienteCapacidadeInput(recipienteCapacidade.toString());
  }, [recipienteCapacidade]);

  // Compute goal whenever inputs change
  useEffect(() => {
    if (activity && climate) {
      const cleanWVal = weightInput.replace(",", ".");
      const parsedWeight = parseFloat(cleanWVal);
      const activeWeight = !isNaN(parsedWeight) ? Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(parsedWeight))) : weight;

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
        recipienteCapacidade
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
        <main className="flex-grow flex flex-col justify-center items-center text-center px-8 z-10 pb-20">
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
            className="px-12 py-4 rounded-full text-white font-medium text-sm flex items-center gap-2 group transition-all duration-300 hover:-translate-y-0.5 max-w-[320px] w-full"
            style={{
              background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
              boxShadow: "0 8px 20px rgba(59,99,119,0.25)",
              letterSpacing: "0.02em",
            }}
          >
            <span className="flex-1 text-center">Começar</span>
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
        <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-3xl mx-auto pb-12">
          <div className="text-center mb-12 max-w-2xl w-full animate-fade-in">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 1 de 4
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Seus dados básicos
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Isso ajuda a calcular sua meta diária de água inicial.
            </p>
          </div>

          <div className="w-full max-w-md space-y-10 mb-12 animate-fade-in">
            {/* Peso */}
            <div>
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: "#5B6572" }}>Peso</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold" style={{ color: "#5ABEFF" }}>{weight}</span>
                  <span className="text-sm font-medium" style={{ color: "#c1c7cc" }}>kg</span>
                </div>
              </div>
              <input
                type="range"
                min={MIN_WEIGHT}
                max={MAX_WEIGHT}
                value={weight}
                onChange={(e) => setWeight(clampWeight(Number(e.target.value)))}
                className="w-full focus:outline-none"
              />
              <div className="flex justify-between w-full mt-2 px-1">
                <span className="text-xs font-semibold text-gray-400">{MIN_WEIGHT}kg</span>
                <span className="text-xs font-semibold text-gray-400">{MAX_WEIGHT}kg</span>
              </div>
            </div>

            {/* Idade */}
            <div>
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: "#5B6572" }}>Idade</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold" style={{ color: "#5ABEFF" }}>{age}</span>
                  <span className="text-sm font-medium" style={{ color: "#c1c7cc" }}>anos</span>
                </div>
              </div>
              <input
                type="range"
                min={12}
                max={100}
                value={age}
                onChange={(e) => setAge(Math.min(100, Math.max(12, Math.round(Number(e.target.value)))))}
                className="w-full focus:outline-none"
              />
              <div className="flex justify-between w-full mt-2 px-1">
                <span className="text-xs font-semibold text-gray-400">12 anos</span>
                <span className="text-xs font-semibold text-gray-400">100 anos</span>
              </div>
            </div>
          </div>

          <StepFooter
            onBack={() => setStep("welcome")}
            onNext={() => setStep("activity")}
          />
        </main>
      </OnboardingShell>
    );
  }

  /* ─── ACTIVITY (step 2/4) ─── */
  if (step === "activity") {
    return (
      <OnboardingShell step={2}>
        <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-5xl mx-auto pb-12">
          <div className="text-center mb-12 max-w-2xl w-full animate-fade-in">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 2 de 4
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Qual é o seu nível de atividade física?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Isso ajuda a ajustar sua meta para compensar a perda de líquidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12 animate-fade-in">
            {ACTIVITIES.map((a) => {
              const isSelected = activity === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActivity(a.id)}
                  className="group relative rounded-2xl p-6 flex items-start gap-4 text-left transition-all duration-300 focus:outline-none"
                  style={{
                    backgroundColor: isSelected ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.7)",
                    border: `1px solid ${isSelected ? "#3b6377" : "rgba(255,255,255,0.6)"}`,
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
                    <p className="text-xs font-semibold mt-2 tracking-wider" style={{ color: "#3b6377" }}>{a.bonus}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <StepFooter
            onBack={() => setStep("weight")}
            onNext={() => setStep("climate")}
            nextDisabled={!activity}
          />
        </main>
      </OnboardingShell>
    );
  }

  /* ─── CLIMATE (step 3/4) ─── */
  if (step === "climate") {
    return (
      <OnboardingShell step={3}>
        <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-5xl mx-auto pb-12">
          <div className="text-center mb-12 max-w-2xl w-full animate-fade-in">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 3 de 4
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Como é o clima onde você mora?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Isso nos ajuda a entender sua taxa de transpiração básica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12 animate-fade-in">
            {CLIMATES.map((c) => {
              const isSelected = climate === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setClimate(c.id)}
                  className="group relative rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center transition-all duration-300 focus:outline-none min-h-[200px]"
                  style={{
                    backgroundColor: isSelected ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.7)",
                    border: `1px solid ${isSelected ? "#3b6377" : "rgba(255,255,255,0.6)"}`,
                    boxShadow: isSelected ? "0 12px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.02)",
                    transform: isSelected ? "translateY(-4px)" : "none",
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-105">
                    <span className="material-symbols-outlined text-[32px] transition-all duration-300"
                      style={{
                        color: isSelected ? "#3b6377" : "rgba(59,99,119,0.7)",
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
                    <p className="text-xs font-semibold mt-1 tracking-wider" style={{ color: "#3b6377" }}>{c.bonus}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <StepFooter
            onBack={() => setStep("activity")}
            onNext={() => setStep("recipiente_setup")}
            nextDisabled={!climate}
          />
        </main>
      </OnboardingShell>
    );
  }

  /* ─── RECIPIENTE SETUP ─── */
  if (step === "recipiente_setup") {
    let containerLabel = "Garrafa pequena";
    let svgComponent = <BottleSvg />;

    if (recipienteCapacidade < 350) {
      containerLabel = "Copo pequeno";
      svgComponent = <CopoSvg />;
    } else if (recipienteCapacidade >= 350 && recipienteCapacidade < 600) {
      containerLabel = "Garrafa pequena";
      svgComponent = <BottleSvg />;
    } else if (recipienteCapacidade >= 600 && recipienteCapacidade < 900) {
      containerLabel = "Garrafa média";
      svgComponent = <BottleSvg />;
    } else if (recipienteCapacidade >= 900 && recipienteCapacidade < 1200) {
      containerLabel = "Garrafa grande";
      svgComponent = <BottleSvg />;
    } else if (recipienteCapacidade >= 1200 && recipienteCapacidade < 1800) {
      containerLabel = "Garrafa esportiva";
      svgComponent = <SportsBottleSvg />;
    } else {
      containerLabel = "Garrafão";
      svgComponent = <JugSvg />;
    }

    return (
      <OnboardingShell step={4}>
        <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-3xl mx-auto pb-12">
          <div className="text-center mb-8 max-w-2xl w-full animate-fade-in">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 4 de 4 (Opcional)
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Você costuma usar um recipiente principal?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Ajuda a transformar mililitros em medidas mais fáceis de visualizar.
            </p>
          </div>

          <div className="w-full max-w-md flex flex-col items-center mb-12 animate-fade-in">
            <div className="flex flex-col items-center justify-center h-[180px] mb-8">
              {svgComponent}
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-semibold" style={{ color: "#3b6377" }}>{recipienteCapacidade}</span>
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

          <div className="flex items-center justify-center gap-4 w-full max-w-md mx-auto">
            <button
              onClick={() => setStep("climate")}
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
              className="px-6 py-4 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50 border border-gray-200 cursor-pointer"
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
              className="flex-1 px-8 py-4 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
                boxShadow: "0 8px 20px rgba(59,99,119,0.25)",
              }}
            >
              Confirmar
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </main>
      </OnboardingShell>
    );
  }

  /* ─── RESULT ─── */
  return (
    <OnboardingShell step={0}>
      <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 pb-12 pt-6 overflow-y-auto">
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
              style={{ background: "linear-gradient(90deg, #3b6377, #006492, #0d658c)" }} />

            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 relative"
              style={{ backgroundColor: "#bfe8ff" }}>
              <div className="absolute inset-0 rounded-full border-2 animate-ripple"
                style={{ borderColor: "#c0e8ff" }} />
              <span className="material-symbols-outlined text-[40px]"
                style={{ color: "#3b6377", fontVariationSettings: "'FILL' 1" }}>
                water_drop
              </span>
            </div>

            <h2 className="text-3xl font-semibold mb-2" style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
              Sua meta diária:
              <span className="block mt-1 text-5xl font-semibold tracking-[-0.04em]" style={{ color: "#006492" }}>
                {formatGoal(goal)}
              </span>
            </h2>

            {/* Inline Editor Form */}
            <div className="w-full mt-4 pt-4 border-t flex flex-col gap-3 text-left mb-6" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Revise ou ajuste seus dados diretamente:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Peso */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Peso (kg)</label>
                  <input
                    type="text"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    onBlur={() => {
                      const cleanVal = weightInput.replace(",", ".");
                      let parsed = parseFloat(cleanVal);
                      if (isNaN(parsed)) parsed = 70;
                      const finalVal = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(parsed)));
                      setWeight(finalVal);
                      setWeightInput(finalVal.toString());
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#3b6377]"
                    style={{ backgroundColor: "white", borderColor: "#e0e3e6", color: "#191c1e" }}
                  />
                </div>

                {/* Idade */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Idade (anos)</label>
                  <input
                    type="text"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    onBlur={() => {
                      const cleanVal = ageInput.replace(",", ".");
                      let parsed = parseFloat(cleanVal);
                      if (isNaN(parsed)) parsed = 25;
                      const finalVal = Math.min(100, Math.max(12, Math.round(parsed)));
                      setAge(finalVal);
                      setAgeInput(finalVal.toString());
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#3b6377]"
                    style={{ backgroundColor: "white", borderColor: "#e0e3e6", color: "#191c1e" }}
                  />
                </div>

                {/* Atividade */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[11px] font-medium text-gray-500">Atividade física</label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#3b6377] bg-white text-[#191c1e]"
                    style={{ borderColor: "#e0e3e6" }}
                  >
                    {ACTIVITIES.map((a) => (
                      <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Clima */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[11px] font-medium text-gray-500">Clima predominante</label>
                  <select
                    value={climate}
                    onChange={(e) => setClimate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#3b6377] bg-white text-[#191c1e]"
                    style={{ borderColor: "#e0e3e6" }}
                  >
                    {CLIMATES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Recipiente Principal */}
                <div className="flex flex-col gap-1 col-span-2 pt-1 border-t border-dashed border-gray-100 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">Recipiente Principal</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRecipienteConfigurado(true)}
                        className={`text-[10px] px-2.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                          recipienteConfigurado
                            ? "bg-[#3b6377] text-white border-[#3b6377]"
                            : "bg-white text-gray-500 border-gray-200"
                        }`}
                      >
                        Ativado
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipienteConfigurado(false)}
                        className={`text-[10px] px-2.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                          !recipienteConfigurado
                            ? "bg-[#3b6377] text-white border-[#3b6377]"
                            : "bg-white text-gray-500 border-gray-200"
                        }`}
                      >
                        Desativado
                      </button>
                    </div>
                  </div>
                  {recipienteConfigurado && (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={recipienteCapacidadeInput}
                        onChange={(e) => setRecipienteCapacidadeInput(e.target.value)}
                        onBlur={() => {
                          const cleanVal = recipienteCapacidadeInput.replace(",", ".");
                          let parsed = parseFloat(cleanVal);
                          if (isNaN(parsed)) parsed = 500;
                          const finalVal = Math.min(2000, Math.max(200, Math.round(parsed)));
                          setRecipienteCapacidade(finalVal);
                          setRecipienteCapacidadeInput(finalVal.toString());
                        }}
                        className="w-20 px-2 py-1 rounded text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#3b6377]"
                        style={{ backgroundColor: "white", borderColor: "#e0e3e6", color: "#191c1e" }}
                      />
                      <span className="text-xs text-gray-500 font-semibold">ml ({
                        recipienteCapacidade < 350
                          ? "Copo"
                          : recipienteCapacidade < 600
                          ? "Garrafa pequena"
                          : recipienteCapacidade < 900
                          ? "Garrafa média"
                          : recipienteCapacidade < 1200
                          ? "Garrafa grande"
                          : recipienteCapacidade < 1800
                          ? "Garrafa esportiva"
                          : "Garrafão"
                      })</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 group transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
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
              className="mt-3 text-sm font-medium transition-colors hover:text-[#3b6377] cursor-pointer"
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
