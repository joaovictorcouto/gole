import { useNavigate } from "react-router-dom";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center p-8"
      style={{ backgroundColor: "#f7f9fc" }}>
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-[100px] h-[100px] flex items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <path d="M50 15C50 15 25 45 25 65C25 78.8071 36.1929 90 50 90C63.8071 90 75 78.8071 75 65C75 45 50 15 50 15Z"
              fill="url(#logo-grad)" />
            <path d="M50 25C50 25 32 48 32 65C32 74.9411 40.0589 83 50 83C59.9411 83 68 74.9411 68 65C68 48 50 25 50 25Z"
              fill="white" fillOpacity="0.2" />
            <defs>
              <linearGradient id="logo-grad" x1="50" y1="15" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#BFE8FF" />
                <stop offset="1" stopColor="#5ABEFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-4 px-2 max-w-md">
        <h1 className="text-5xl font-semibold leading-[1.1] tracking-[-0.04em]" style={{ color: "#2C3440" }}>
          Vamos calcular sua meta diária de hidratação
        </h1>
        <p className="text-lg" style={{ color: "#5B6572", lineHeight: "1.6" }}>
          Responder algumas perguntas rápidas ajuda a criar lembretes mais inteligentes.
        </p>
      </div>

      {/* CTA */}
      <div className="w-full max-w-md pt-6">
        <button
          onClick={() => navigate("/onboarding/weight")}
          className="w-full py-4 px-8 rounded-full text-white font-medium text-sm flex justify-center items-center gap-2 group transition-all duration-300 hover:brightness-110"
          style={{
            background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            letterSpacing: "0.02em",
          }}
        >
          Começar
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform duration-200">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}
