import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { featureFlags } from "../../lib/featureFlags";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  ...(featureFlags.statistics ? [{ path: "/statistics", label: "Estatísticas", icon: "bar_chart" }] : []),
  ...(featureFlags.achievements ? [{ path: "/achievements", label: "Conquistas", icon: "emoji_events" }] : []),
  { path: "/settings", label: "Configurações", icon: "settings" },
];

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logDrink, todayStats } = useAppStore();

  const handleDrink = async () => {
    const ml = todayStats?.suggested_per_reminder ?? 250;
    await logDrink(ml);
  };

  return (
    <nav
      className="flex flex-col py-6 px-6 h-screen w-[280px] left-0 fixed border-r z-50"
      style={{
        backgroundColor: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.2)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)"
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-full overflow-hidden border shrink-0 flex items-center justify-center"
          style={{ backgroundColor: "#bfe8ff", borderColor: "rgba(44,52,64,0.08)" }}>
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
            <path d="M50 15C50 15 25 45 25 65C25 78.8071 36.1929 90 50 90C63.8071 90 75 78.8071 75 65C75 45 50 15 50 15Z" fill="url(#nav-grad)" />
            <defs>
              <linearGradient id="nav-grad" x1="50" y1="15" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#BFE8FF" />
                <stop offset="1" stopColor="#5ABEFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-none" style={{ color: "#3b6377", letterSpacing: "-0.01em" }}>
            Hidratação
          </h1>
          <p className="text-xs font-semibold tracking-[0.05em] mt-1" style={{ color: "#5B6572" }}>
            Mantenha-se fluído
          </p>
        </div>
      </div>

      {/* Navigation */}
      <ul className="flex-grow space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-300 group"
                style={{
                  backgroundColor: active ? "rgba(191,232,255,0.3)" : "transparent",
                  color: active ? "#3b6377" : "#5B6572",
                  fontWeight: active ? "700" : "500",
                  fontSize: "14px",
                  letterSpacing: "0.02em",
                }}
              >
                <span
                  className="material-symbols-outlined transition-transform duration-200 group-hover:translate-x-1"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="mt-auto space-y-4">
        <button
          onClick={handleDrink}
          className="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-md hover:saturate-150"
          style={{
            background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
            boxShadow: "0 8px 20px rgba(59,99,119,0.2)",
            letterSpacing: "0.02em",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">water_drop</span>
          Beber Água
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-[#e6e8eb]/50"
          style={{ color: "#5B6572", fontSize: "14px", letterSpacing: "0.02em" }}
        >
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform duration-200">
            help_outline
          </span>
          Suporte
        </button>
      </div>
    </nav>
  );
}
