import { useState } from "react";
import { useNavigate } from "react-router-dom";

const climates = [
  { id: "cold", icon: "ac_unit", label: "Frio", description: "Abaixo de 18°C", bonus: "+0ml" },
  { id: "temperate", icon: "partly_cloudy_day", label: "Temperado", description: "18°C - 28°C", bonus: "+200ml" },
  { id: "hot", icon: "light_mode", label: "Quente", description: "Acima de 28°C", bonus: "+500ml" },
];

interface ClimateProps {
  onClimate: (climate: string) => void;
  initialClimate?: string;
}

export function Climate({ onClimate, initialClimate = "" }: ClimateProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(initialClimate);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: "#f7f9fc" }}>
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[60px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(191,232,255,0.6) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(198,231,255,0.5) 0%, transparent 70%)" }} />

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
            Passo 4 de 4
          </span>
          <h1 className="text-5xl font-semibold leading-tight mb-4" style={{ color: "#191c1e", letterSpacing: "-0.04em" }}>
            Como é o clima onde você passa a maior parte do dia?
          </h1>
          <p className="text-lg" style={{ color: "#5B6572" }}>
            Isso nos ajuda a entender sua taxa de transpiração e ajustar sua meta de hidratação ideal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          {climates.map((c) => {
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="group relative rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center transition-all duration-300 focus:outline-none min-h-[240px]"
                style={{
                  backgroundColor: isSelected ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${isSelected ? "#3b6377" : "rgba(255,255,255,0.6)"}`,
                  boxShadow: isSelected ? "0 12px 40px rgba(0,0,0,0.08)" : "none",
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

        <button
          onClick={() => { if (selected) { onClimate(selected); navigate("/onboarding/result"); } }}
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
          Ver Resultado
        </button>
      </main>
    </div>
  );
}
