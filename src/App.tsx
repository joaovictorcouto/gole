import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "./store/useAppStore";
import { SideNav } from "./components/ui/SideNav";
import { UpdateProfileToast } from "./components/ui/UpdateProfileToast";
import { Onboarding } from "./pages/onboarding/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { Statistics } from "./pages/Statistics";
import { Achievements } from "./pages/Achievements";
import { Settings } from "./pages/Settings";
import { api } from "./lib/api";
import { featureFlags } from "./lib/featureFlags";
import { playSound, SoundPreset } from "./lib/sounds";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f7f9fc" }}>
      <SideNav />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
      <UpdateProfileToast />
    </div>
  );
}

function NavigationListener() {
  const navigate = useNavigate();
  const { loadSettings, loadTodayStats } = useAppStore();

  useEffect(() => {
    const unlistenNavigate = listen<string>("navigate", (event) => {
      navigate(event.payload);
    });

    const unlistenQuickDrink = listen<number>("quick-drink", async () => {
      await loadTodayStats();
      useAppStore.setState((s) => ({ drinkTick: s.drinkTick + 1 }));
    });

    const unlistenResetOnboarding = listen("reset-onboarding", async () => {
      await loadSettings();
      navigate("/onboarding", { replace: true });
    });

    // Sincroniza quando a tray toggle pausa/retoma lembretes
    const unlistenRemindersPaused = listen<boolean>("reminders_paused", async () => {
      await loadSettings();
    });

    return () => {
      unlistenNavigate.then((fn) => fn());
      unlistenQuickDrink.then((fn) => fn());
      unlistenResetOnboarding.then((fn) => fn());
      unlistenRemindersPaused.then((fn) => fn());
    };
  }, [navigate]);

  return null;
}

export default function App() {
  const { settings, loadSettings, drinkTick } = useAppStore();
  const [ready, setReady] = useState(false);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pauseToast, setPauseToast] = useState<"paused" | "resumed" | null>(null);
  const pauseToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPausedRef = useRef<boolean | null>(null);

  // Mostra toast quando reminders_paused muda
  useEffect(() => {
    if (settings === null) return;
    const paused = settings.reminders_paused;
    if (prevPausedRef.current !== null && prevPausedRef.current !== paused) {
      if (pauseToastTimerRef.current) clearTimeout(pauseToastTimerRef.current);
      setPauseToast(paused ? "paused" : "resumed");
      pauseToastTimerRef.current = setTimeout(() => setPauseToast(null), 4000);
    }
    prevPausedRef.current = paused;
  }, [settings?.reminders_paused]);

  useEffect(() => {
    loadSettings().then(() => setReady(true));
  }, []);

  useEffect(() => {
    const isNewerVersion = (current: string, latest: string): boolean => {
      const cParts = current.split(".").map(Number);
      const lParts = latest.split(".").map(Number);
      for (let i = 0; i < 3; i++) {
        const c = cParts[i] || 0;
        const l = lParts[i] || 0;
        if (l > c) return true;
        if (l < c) return false;
      }
      return false;
    };

    const checkForUpdates = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const lastCheck = localStorage.getItem("last_silent_update_check_date");
        if (lastCheck === today) return;

        localStorage.setItem("last_silent_update_check_date", today);

        const res = await fetch("https://api.github.com/repos/joaovictorcouto/gole/releases/latest");
        if (!res.ok) return;
        const data = await res.json();
        
        const latestVersion = data.tag_name.replace(/^v/, "");
        const currentVersion = "0.1.0";

        if (isNewerVersion(currentVersion, latestVersion)) {
          const asset = data.assets.find((a: any) => a.name.endsWith(".msi") || a.name.endsWith(".exe"));
          if (asset) {
            await api.installSilentUpdate(asset.browser_download_url);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar atualização silenciosa:", err);
      }
    };

    checkForUpdates();
  }, []);

  useEffect(() => {
    const unlisten = listen<{ id: number; phrase: string; suggested_ml: number }>("reminder", () => {
      const s = useAppStore.getState().settings;
      if (s) playSound(s.sound_preset as SoundPreset, s.sound_volume);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  useEffect(() => {
    if (!settings) return;
    const intervalMs = settings.reminder_interval_min * 60 * 1000;

    const schedule = () => {
      reminderTimerRef.current = setTimeout(async () => {
        if (!settings.reminders_paused) {
          await api.sendReminder(false);
        }
        schedule();
      }, intervalMs);
    };

    schedule();
    return () => {
      if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    };
  }, [settings?.reminder_interval_min, settings?.reminders_paused, drinkTick]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7f9fc" }}>
        <div className="flex flex-col items-center gap-4">
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
            <path d="M50 15C50 15 25 45 25 65C25 78.8071 36.1929 90 50 90C63.8071 90 75 78.8071 75 65C75 45 50 15 50 15Z"
              fill="url(#splash-grad)" />
            <defs>
              <linearGradient id="splash-grad" x1="50" y1="15" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#BFE8FF" />
                <stop offset="1" stopColor="#5ABEFF" />
              </linearGradient>
            </defs>
          </svg>
          <p className="text-sm" style={{ color: "#5B6572" }}>Carregando GOLE...</p>
        </div>
      </div>
    );
  }

  const onboardingDone = settings?.onboarding_complete ?? false;
  return (
    <>
      <BrowserRouter>
        <NavigationListener />
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/dashboard" element={
            onboardingDone
              ? <AppLayout><Dashboard /></AppLayout>
              : <Navigate to="/onboarding" replace />
          } />
          {featureFlags.statistics && (
            <Route path="/statistics" element={
              onboardingDone
                ? <AppLayout><Statistics /></AppLayout>
                : <Navigate to="/onboarding" replace />
            } />
          )}
          {featureFlags.achievements && (
            <Route path="/achievements" element={
              onboardingDone
                ? <AppLayout><Achievements /></AppLayout>
                : <Navigate to="/onboarding" replace />
            } />
          )}
          <Route path="/settings" element={
            onboardingDone
              ? <AppLayout><Settings /></AppLayout>
              : <Navigate to="/onboarding" replace />
          } />

          <Route path="/" element={
            onboardingDone
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/onboarding" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast global de pausa/retomada de lembretes */}
      {pauseToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-fade-in"
          style={{
            background: pauseToast === "paused"
              ? "rgba(25,28,30,0.94)"
              : "linear-gradient(135deg, #257ca3, #0f76a0)",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
            minWidth: 320,
            justifyContent: "center",
          }}
        >
          <span className="text-lg">{pauseToast === "paused" ? "⏸" : "▶"}</span>
          <div className="text-sm text-white font-medium">
            {pauseToast === "paused" ? (
              <>
                <span className="font-semibold">Lembretes pausados</span>
                <span className="text-white/70 ml-1">— serão retomados amanhã automaticamente.</span>
              </>
            ) : (
              <span className="font-semibold">Lembretes retomados! 💧</span>
            )}
          </div>
          <button
            onClick={() => setPauseToast(null)}
            className="text-white/40 hover:text-white/70 ml-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </>
  );
}
