import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface WeightProps {
  onWeight: (weight: number) => void;
  initialWeight?: number;
}

export function Weight({ onWeight, initialWeight = 70 }: WeightProps) {
  const navigate = useNavigate();
  const [weight, setWeight] = useState(initialWeight);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#f7f9fc" }}>
      {/* Background decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full blur-[100px]"
          style={{ backgroundColor: "rgba(191,232,255,0.2)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px]"
          style={{ backgroundColor: "rgba(141,209,253,0.1)" }} />
      </div>

      <main className="w-full max-w-[480px] flex flex-col justify-between px-8 py-12 relative z-10 bg-white rounded-3xl border my-12"
        style={{ borderColor: "rgba(44,52,64,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>

        {/* Header */}
        <header className="flex justify-between items-center w-full mb-12">
          <button
            onClick={() => navigate("/onboarding")}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[#eceef1]"
            style={{ color: "#71787c" }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          {/* Progress dots */}
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#e0e3e6" }} />
            <div className="w-8 h-2 rounded-full" style={{ backgroundColor: "#5ABEFF" }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#e0e3e6" }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#e0e3e6" }} />
          </div>
          <button
            onClick={() => { onWeight(weight); navigate("/onboarding/activity"); }}
            className="text-sm font-medium transition-colors hover:text-[#3b6377]"
            style={{ color: "#5B6572", letterSpacing: "0.02em" }}
          >
            Pular
          </button>
        </header>

        {/* Content */}
        <section className="flex-1 flex flex-col items-center justify-center w-full mb-12">
          <div className="text-center mb-12 w-full">
            <h1 className="text-3xl font-semibold mb-2" style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
              Qual é o seu peso?
            </h1>
            <p className="text-base" style={{ color: "#5B6572" }}>
              Isso ajuda a calcular sua meta diária de água.
            </p>
          </div>

          {/* Value display */}
          <div className="relative w-full flex justify-center items-end mb-6 h-[120px]">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold leading-none tracking-tighter transition-all duration-150"
                style={{ fontSize: "72px", color: "#5ABEFF" }}>
                {weight}
              </span>
              <span className="text-xl font-medium pb-2" style={{ color: "#c1c7cc" }}>kg</span>
            </div>
          </div>

          {/* Slider */}
          <div className="w-full relative px-4">
            <div className="flex justify-between w-full px-2 mb-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className={`${i % 4 === 0 ? "w-1 h-3" : "w-1 h-2"} rounded-full`}
                  style={{ backgroundColor: i % 4 === 0 ? "#e0e3e6" : "#eceef1" }} />
              ))}
            </div>
            <input
              type="range"
              min="40"
              max="150"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full focus:outline-none"
            />
            <div className="flex justify-between w-full mt-4 px-1">
              <span className="text-xs font-semibold tracking-[0.05em]" style={{ color: "#c1c7cc" }}>40</span>
              <span className="text-xs font-semibold tracking-[0.05em]" style={{ color: "#c1c7cc" }}>150</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <button
          onClick={() => { onWeight(weight); navigate("/onboarding/activity"); }}
          className="w-full py-4 px-6 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: "linear-gradient(180deg, #5ABEFF 0%, #2B9EE0 100%)",
            boxShadow: "0 8px 20px rgba(90,190,255,0.3)",
            letterSpacing: "0.02em",
          }}
        >
          Próximo
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </main>
    </div>
  );
}
