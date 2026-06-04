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

    return () => {
      unlistenNavigate.then((fn) => fn());
      unlistenQuickDrink.then((fn) => fn());
      unlistenResetOnboarding.then((fn) => fn());
    };
  }, [navigate]);

  return null;
}

export default function App() {
  const { settings, loadSettings, drinkTick } = useAppStore();
  const [ready, setReady] = useState(false);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSettings().then(() => setReady(true));
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
  );
}
