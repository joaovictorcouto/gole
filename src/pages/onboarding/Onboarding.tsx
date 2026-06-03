import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { api } from "../../lib/api";

type Step = "welcome" | "weight" | "activity" | "climate" | "result";

const ACTIVITIES = [
  { id: "sedentary", emoji: "🛋️", label: "Quase não me exercito", description: "Trabalho sentado, pouco movimento", bonus: "+0ml" },
  { id: "light", emoji: "🚶", label: "Faço atividades leves", description: "Caminhadas, tarefas domésticas", bonus: "+300ml" },
  { id: "moderate", emoji: "🏃", label: "Me exercito regularmente", description: "Academia, esportes 3-5x por semana", bonus: "+600ml" },
  { id: "active", emoji: "🏋️", label: "Tenho rotina muito ativa", description: "Treinos intensos ou trabalho físico", bonus: "+1000ml" },
];

const CLIMATES = [
  { id: "cold", icon: "ac_unit", label: "Frio", description: "Abaixo de 18°C", bonus: "+0ml" },
  { id: "temperate", icon: "partly_cloudy_day", label: "Temperado", description: "18°C - 28°C", bonus: "+200ml" },
  { id: "hot", icon: "light_mode", label: "Quente", description: "Acima de 28°C", bonus: "+500ml" },
];

const MIN_WEIGHT = 40;
const MAX_WEIGHT = 150;

function clampWeight(value: number): number {
  if (isNaN(value)) return 70;
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(value)));
}

function formatGoal(ml: number): string {
  return (ml / 1000).toFixed(1).replace(".", ",") + " L";
}

/** Reusable shell: GOLE logo + step indicator (3 steps), free layout, ambient blobs */
function OnboardingShell({
  step,
  totalSteps = 3,
  children,
}: {
  step: number; // 0 for welcome (no indicator), 1/2/3 for actual steps
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

      {/* Unified header: GOLE logo + step indicator */}
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
  const [activity, setActivity] = useState<string>("");
  const [climate, setClimate] = useState<string>("");
  const [goal, setGoal] = useState(2450);
  const [submitting, setSubmitting] = useState(false);

  // Compute goal whenever inputs change (so Result is always accurate)
  useEffect(() => {
    if (activity && climate) {
      api.calculateGoal(weight, activity, climate).then(setGoal).catch(() => {});
    }
  }, [weight, activity, climate]);

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await completeOnboarding(weight, activity || "sedentary", climate || "temperate");
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
              Responder 3 perguntas rápidas ajuda a criar lembretes mais inteligentes.
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

  /* ─── WEIGHT (step 1/3) ─── */
  if (step === "weight") {
    return (
      <OnboardingShell step={1}>
        <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-3xl mx-auto pb-12">
          <div className="text-center mb-12 max-w-2xl w-full animate-fade-in">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 1 de 3
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Qual é o seu peso?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Isso ajuda a calcular sua meta diária de água.
            </p>
          </div>

          <div className="w-full max-w-md mb-12 animate-fade-in">
            {/* Value display */}
            <div className="flex justify-center items-end mb-8 h-[120px]">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold leading-none tracking-tighter transition-all duration-150"
                  style={{ fontSize: "96px", color: "#5ABEFF" }}>
                  {weight}
                </span>
                <span className="text-2xl font-medium pb-3" style={{ color: "#c1c7cc" }}>kg</span>
              </div>
            </div>

            {/* Slider */}
            <div className="w-full px-4">
              <div className="flex justify-between w-full px-2 mb-4">
                {Array.from({ length: 13 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${i % 4 === 0 ? "w-1 h-3" : "w-1 h-2"} rounded-full`}
                    style={{ backgroundColor: i % 4 === 0 ? "#c1c7cc" : "#e0e3e6" }}
                  />
                ))}
              </div>
              <input
                type="range"
                min={MIN_WEIGHT}
                max={MAX_WEIGHT}
                value={weight}
                onChange={(e) => setWeight(clampWeight(Number(e.target.value)))}
                className="w-full focus:outline-none"
              />
              <div className="flex justify-between w-full mt-4 px-1">
                <span className="text-xs font-semibold tracking-[0.05em]" style={{ color: "#71787c" }}>{MIN_WEIGHT}kg</span>
                <span className="text-xs font-semibold tracking-[0.05em]" style={{ color: "#71787c" }}>{MAX_WEIGHT}kg</span>
              </div>
              <p className="text-xs text-center mt-4" style={{ color: "#71787c" }}>
                Arraste o controle para ajustar (entre {MIN_WEIGHT}kg e {MAX_WEIGHT}kg)
              </p>
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

  /* ─── ACTIVITY (step 2/3) ─── */
  if (step === "activity") {
    return (
      <OnboardingShell step={2}>
        <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-5xl mx-auto pb-12">
          <div className="text-center mb-12 max-w-2xl w-full animate-fade-in">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 2 de 3
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
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
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

  /* ─── CLIMATE (step 3/3) ─── */
  if (step === "climate") {
    return (
      <OnboardingShell step={3}>
        <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-5xl mx-auto pb-12">
          <div className="text-center mb-12 max-w-2xl w-full animate-fade-in">
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
              style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
              Passo 3 de 3
            </span>
            <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
              Como é o clima onde você passa a maior parte do dia?
            </h1>
            <p className="text-lg" style={{ color: "#5B6572" }}>
              Isso nos ajuda a entender sua taxa de transpiração e ajustar sua meta ideal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12 animate-fade-in">
            {CLIMATES.map((c) => {
              const isSelected = climate === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setClimate(c.id)}
                  className="group relative rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center transition-all duration-300 focus:outline-none min-h-[240px]"
                  style={{
                    backgroundColor: isSelected ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid ${isSelected ? "#3b6377" : "rgba(255,255,255,0.6)"}`,
                    boxShadow: isSelected ? "0 12px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.02)",
                    transform: isSelected ? "translateY(-4px)" : "none",
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-105">
                    <span className="material-symbols-outlined text-[40px] transition-all duration-300"
                      style={{
                        color: isSelected ? "#3b6377" : "rgba(59,99,119,0.7)",
                        fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0",
                      }}>
                      {c.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
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
            onNext={() => setStep("result")}
            nextLabel="Ver Resultado"
            nextDisabled={!climate}
          />
        </main>
      </OnboardingShell>
    );
  }

  /* ─── RESULT ─── */
  return (
    <OnboardingShell step={3}>
      <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 pb-12">
        <div className="w-full max-w-[480px] flex flex-col items-center animate-fade-in">
          <div
            className="w-full rounded-[2rem] p-10 flex flex-col items-center text-center relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1"
              style={{ background: "linear-gradient(90deg, #3b6377, #006492, #0d658c)" }} />

            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative"
              style={{ backgroundColor: "#bfe8ff" }}>
              <div className="absolute inset-0 rounded-full border-2 animate-ripple"
                style={{ borderColor: "#c0e8ff" }} />
              <span className="material-symbols-outlined text-[48px]"
                style={{ color: "#3b6377", fontVariationSettings: "'FILL' 1" }}>
                water_drop
              </span>
            </div>

            <h2 className="text-3xl font-semibold mb-4" style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
              Sua meta diária:
              <span className="block mt-2 text-5xl font-semibold tracking-[-0.04em]" style={{ color: "#006492" }}>
                {formatGoal(goal)}
              </span>
            </h2>

            <p className="text-base mb-8 max-w-[320px]" style={{ color: "#41484c", lineHeight: "1.6" }}>
              Vamos ajudar você a atingir essa meta ao longo do dia, com lembretes no momento certo.
            </p>

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
              onClick={() => setStep("climate")}
              className="mt-3 text-sm font-medium transition-colors hover:text-[#3b6377]"
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
