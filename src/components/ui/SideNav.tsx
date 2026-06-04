import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { featureFlags } from "../../lib/featureFlags";
import { SupportModal } from "./SupportModal";
import { ChangelogModal } from "./ChangelogModal";
import appIcon from "../../assets/icon.png";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  ...(featureFlags.statistics ? [{ path: "/statistics", label: "Estatísticas", icon: "bar_chart" }] : []),
  ...(featureFlags.achievements ? [{ path: "/achievements", label: "Conquistas", icon: "emoji_events" }] : []),
  { path: "/settings", label: "Configurações", icon: "settings" },
];

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logDrink, todayStats, settings, loadSettings } = useAppStore();
  const [supportOpen, setSupportOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  useEffect(() => { if (!settings) loadSettings(); }, []);

  // Always use suggested per-reminder amount (calculated from daily goal)
  const drinkAmount = todayStats?.suggested_per_reminder ?? 250;
  // settings is referenced only to keep store hot
  void settings;

  const handleDrink = async () => {
    await logDrink(drinkAmount);
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
      <div className="flex items-center gap-3 mb-12">
        <div className="w-11 h-11 shrink-0 flex items-center justify-center">
          <img src={appIcon} alt="Gole" style={{ width: 44, height: 44, objectFit: "contain" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black leading-none" style={{ color: "#257ca3", letterSpacing: "-0.04em" }}>
            GOLE
          </h1>
          <p className="text-[10.5px] font-semibold tracking-[0.04em] mt-1.5" style={{ color: "#5B6572" }}>
            Mantenha-se hidratado
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
                  color: active ? "#257ca3" : "#5B6572",
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
            background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
            boxShadow: "0 8px 20px rgba(59,99,119,0.2)",
            letterSpacing: "0.02em",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">water_drop</span>
          Beber Água
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", letterSpacing: "0.04em" }}>
            +{drinkAmount}ml
          </span>
        </button>
        <button
          onClick={() => setSupportOpen(true)}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-[#e6e8eb]/50 cursor-pointer"
          style={{ color: "#5B6572", fontSize: "14px", letterSpacing: "0.02em" }}
        >
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform duration-200">
            help_outline
          </span>
          Suporte
        </button>

        <div className="text-[10px] text-center text-gray-400 font-medium pt-1">
          v0.1.0 • <button onClick={() => setChangelogOpen(true)} className="underline hover:text-gray-600 cursor-pointer">O que há de novo?</button>
        </div>
      </div>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </nav>
  );
}
