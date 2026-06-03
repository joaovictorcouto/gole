import { useState } from "react";
import { useNavigate } from "react-router-dom";

const activities = [
  {
    id: "sedentary",
    emoji: "🛋️",
    label: "Quase não me exercito",
    description: "Trabalho sentado, pouco movimento",
    bonus: "+0ml",
  },
  {
    id: "light",
    emoji: "🚶",
    label: "Faço atividades leves",
    description: "Caminhadas, tarefas domésticas",
    bonus: "+300ml",
  },
  {
    id: "moderate",
    emoji: "🏃",
    label: "Me exercito regularmente",
    description: "Academia, esportes 3-5x por semana",
    bonus: "+600ml",
  },
  {
    id: "active",
    emoji: "🏋️",
    label: "Tenho rotina muito ativa",
    description: "Treinos intensos ou trabalho físico",
    bonus: "+1000ml",
  },
];

interface ActivityProps {
  onActivity: (activity: string) => void;
  initialActivity?: string;
}

export function Activity({ onActivity, initialActivity = "" }: ActivityProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(initialActivity);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: "#f7f9fc" }}>
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[60px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(191,232,255,0.6) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(198,231,255,0.5) 0%, transparent 70%)" }} />

      {/* Header */}
      <header className="w-full px-8 py-6 flex justify-between items-center z-10 relative">
        <div className="text-2xl font-semibold tracking-tight" style={{ color: "#3b6377" }}>GOLE</div>
        <div className="flex gap-2 items-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-8 h-1.5 rounded-full" style={{ backgroundColor: "#e0e3e6" }} />
          ))}
          <div className="w-8 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: "#3b6377" }} />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 w-full max-w-5xl mx-auto pb-12">
        <div className="text-center mb-12 max-w-2xl w-full animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-widest mb-4 block px-4 py-1 rounded-full w-max mx-auto"
            style={{ color: "#41484c", backgroundColor: "rgba(224,227,230,0.5)" }}>
            Passo 3 de 4
          </span>
          <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
            Qual é o seu nível de atividade física?
          </h1>
          <p className="text-lg" style={{ color: "#5B6572" }}>
            Isso ajuda a ajustar sua meta para compensar a perda de líquidos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
          {activities.map((a) => {
            const isSelected = selected === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className="group relative rounded-2xl p-6 flex items-start gap-4 text-left transition-all duration-300 focus:outline-none"
                style={{
                  backgroundColor: isSelected ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${isSelected ? "#3b6377" : "rgba(255,255,255,0.6)"}`,
                  boxShadow: isSelected ? "0 12px 40px rgba(0,0,0,0.08)" : "none",
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

        <button
          onClick={() => { if (selected) { onActivity(selected); navigate("/onboarding/climate"); } }}
          disabled={!selected}
          className="px-12 py-5 rounded-full text-white font-medium text-sm tracking-wide transition-all duration-300 w-full max-w-[320px]"
          style={{
            background: "linear-gradient(180deg, #3b6377 0%, #3b6377 100%)",
            boxShadow: selected ? "0 8px 20px rgba(59,99,119,0.2)" : "none",
            opacity: selected ? 1 : 0.4,
            cursor: selected ? "pointer" : "not-allowed",
            letterSpacing: "0.02em",
          }}
        >
          Próximo
        </button>
      </main>
    </div>
  );
}
