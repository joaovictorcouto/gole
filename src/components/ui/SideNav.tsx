import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { featureFlags } from "../../lib/featureFlags";
import { SupportModal } from "./SupportModal";
import { ChangelogModal } from "./ChangelogModal";
import { UndoChip } from "./UndoChip";
import { api } from "../../lib/api";
import { useDevGateAvailable, useIsDev, unlockDev, lockDev } from "../../lib/useIsDev";
import appIcon from "../../assets/icon.png";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/reminders", label: "Lembretes", icon: "notifications" },
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
  const [undo, setUndo] = useState<{ amount: number; key: number } | null>(null);
  const [, setLogoClicks] = useState(0);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const devAvailable = useDevGateAvailable();
  const isDev = useIsDev();

  const handleLogoClick = () => {
    if (!devAvailable) return;
    setLogoClicks((c) => {
      const next = c + 1;
      if (next >= 7) {
        setPwdOpen(true);
        return 0;
      }
      return next;
    });
  };

  const handleSubmitPwd = async () => {
    const ok = await unlockDev(pwd);
    if (ok) {
      setPwdOpen(false);
      setPwd("");
      setPwdError(false);
    } else {
      setPwdError(true);
    }
  };

  useEffect(() => { if (!settings) loadSettings(); }, []);

  // Always use suggested per-reminder amount (calculated from daily goal)
  const drinkAmount = todayStats?.suggested_per_reminder ?? 250;
  // settings is referenced only to keep store hot
  void settings;

  const handleDrink = async () => {
    await logDrink(drinkAmount);
    setUndo({ amount: drinkAmount, key: Date.now() });
  };

  const handleUndo = async () => {
    try { await api.deleteLastDrink(); } catch (err) { console.error(err); }
    setUndo(null);
    await loadSettings();
  };

  const isBasic = settings?.app_mode === "basic";
  const filteredNavItems = navItems.filter((item) => {
    if (isBasic && (item.path === "/statistics" || item.path === "/achievements")) {
      return false;
    }
    return true;
  });

  return (
    <nav
      className="flex flex-col py-6 px-6 h-screen w-[280px] left-0 fixed border-r z-50"
      style={{
        backgroundColor: "var(--color-surface-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--color-border-subtle)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)"
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-12 select-none" onClick={handleLogoClick}>
        <div className="w-11 h-11 shrink-0 flex items-center justify-center">
          <img src={appIcon} alt="Gole" style={{ width: 44, height: 44, objectFit: "contain" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black leading-none" style={{ color: "var(--color-primary, #257ca3)", letterSpacing: "-0.04em" }}>
            Gole
          </h1>
          <p className="text-[10.5px] font-semibold tracking-[0.04em] mt-1.5" style={{ color: "var(--color-text-main, #5B6572)" }}>
            Mantenha-se hidratado
          </p>
        </div>
      </div>

      {/* Navigation */}
      <ul className="flex-grow space-y-1">
        {filteredNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors duration-200 group cursor-pointer ${active ? "bg-primary-container/30" : "bg-transparent hover:bg-surface-container-high/60"}`}
                style={{
                  color: active ? "var(--color-primary, #257ca3)" : "var(--color-text-main, #5B6572)",
                  fontWeight: active ? 700 : 500,
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
            background: "linear-gradient(180deg, var(--color-primary, #257ca3) 0%, var(--color-secondary, #0f76a0) 100%)",
            boxShadow: "0 8px 20px rgba(59,99,119,0.2)",
            letterSpacing: "0.02em",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">water_drop</span>
          Beber Água
          {!isBasic && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
              style={{ backgroundColor: "rgba(255,255,255,0.18)", letterSpacing: "0.04em" }}>
              +{drinkAmount}ml
            </span>
          )}
        </button>
        {undo && (
          <div className="-mt-2">
            <UndoChip
              key={undo.key}
              amount={undo.amount}
              onUndo={handleUndo}
              onExpire={() => setUndo(null)}
            />
          </div>
        )}
        <button
          onClick={() => setSupportOpen(true)}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-surface-container-high/50 cursor-pointer"
          style={{ color: "var(--color-text-main, #5B6572)", fontSize: "14px", letterSpacing: "0.02em" }}
        >
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform duration-200">
            help_outline
          </span>
          Suporte
        </button>

        <div className="text-[10px] text-center text-outline font-medium pt-1">
          v{__APP_VERSION__} • <button onClick={() => setChangelogOpen(true)} className="underline hover:text-text-dark cursor-pointer">O que há de novo?</button>
        </div>
      </div>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />

      {isDev && (
        <button
          onClick={lockDev}
          className="absolute top-2 right-2 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md cursor-pointer"
          style={{ background: "#fff3e0", color: "#bf360c" }}
          title="Bloquear módulo dev"
        >
          DEV · lock
        </button>
      )}

      {pwdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => { setPwdOpen(false); setPwd(""); setPwdError(false); }}
        >
          <div
            className="bg-surface rounded-2xl p-6 w-[360px] shadow-2xl border border-outline-variant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--color-primary, #257ca3)" }}>lock</span>
              <h2 className="text-lg font-bold" style={{ color: "var(--color-on-surface, #191c1e)" }}>Acesso restrito</h2>
            </div>
            <input
              type="password"
              value={pwd}
              onChange={(e) => { setPwd(e.target.value); setPwdError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmitPwd(); }}
              placeholder="Senha"
              autoFocus
              className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface-container"
              style={{ borderColor: pwdError ? "#bf360c" : "var(--color-outline-variant, #e0e3e6)" }}
            />
            {pwdError && <p className="text-[11px] mt-2" style={{ color: "#bf360c" }}>Senha incorreta.</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setPwdOpen(false); setPwd(""); setPwdError(false); }}
                className="flex-1 px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-surface-container-high transition-colors"
                style={{ backgroundColor: "var(--color-surface-container-high, rgba(236,238,241,0.7))", color: "var(--color-text-main, #5B6572)" }}
              >Cancelar</button>
              <button
                onClick={handleSubmitPwd}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer hover:shadow-md transition-shadow"
                style={{ background: "linear-gradient(180deg, var(--color-primary, #257ca3) 0%, var(--color-secondary, #0f76a0) 100%)" }}
              >Desbloquear</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
