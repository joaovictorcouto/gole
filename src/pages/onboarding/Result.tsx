import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

interface ResultProps {
  weight: number;
  activity: string;
  climate: string;
  goal: number;
}

function formatGoal(ml: number): string {
  return (ml / 1000).toFixed(1).replace(".", ",") + " L";
}

export function Result({ weight, activity, climate, goal }: ResultProps) {
  const navigate = useNavigate();
  const { completeOnboarding } = useAppStore();

  const handleStart = async () => {
    await completeOnboarding(weight, activity, climate);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at 50% 0%, #e0f2fe 0%, #f7f9fc 50%, #f7f9fc 100%)"
      }}>
      {/* Background decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] z-0 opacity-30"
        style={{ backgroundColor: "#bfe8ff" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] z-0 opacity-30"
        style={{ backgroundColor: "#8dd1fd" }} />

      <main className="w-full max-w-[480px] z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-semibold tracking-tight" style={{ color: "#3b6377" }}>GOLE</h1>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-[2rem] p-10 flex flex-col items-center text-center relative overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          }}
        >
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1"
            style={{ background: "linear-gradient(90deg, #3b6377, #006492, #0d658c)" }} />

          {/* Water drop icon */}
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

          <p className="text-lg mb-12 max-w-[280px]" style={{ color: "#41484c", lineHeight: "1.6" }}>
            Vamos ajudar você a atingir essa meta ao longo do dia, com lembretes no momento certo.
          </p>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 group transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
              boxShadow: "0 8px 20px rgba(59,99,119,0.2)",
              letterSpacing: "0.02em",
            }}
          >
            Começar
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
