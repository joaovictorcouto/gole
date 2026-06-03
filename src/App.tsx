import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "./store/useAppStore";
import { SideNav } from "./components/ui/SideNav";
import { ReminderToast } from "./components/ui/ReminderToast";
import { Onboarding } from "./pages/onboarding/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { Statistics } from "./pages/Statistics";
import { Achievements } from "./pages/Achievements";
import { Settings } from "./pages/Settings";
import { api } from "./lib/api";
import { featureFlags } from "./lib/featureFlags";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      <SideNav />
      <div className="flex-1">
        {children}
      </div>
      <ReminderToast />
    </div>
  );
}

export default function App() {
  const { settings, loadSettings, setReminderNotif } = useAppStore();
  const [ready, setReady] = useState(false);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSettings().then(() => setReady(true));
  }, []);

  useEffect(() => {
    const unlisten = listen<{ id: number; phrase: string; suggested_ml: number }>("reminder", (event) => {
      setReminderNotif(event.payload);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  useEffect(() => {
    if (!settings) return;
    const intervalMs = settings.reminder_interval_min * 60 * 1000;

    const schedule = () => {
      reminderTimerRef.current = setTimeout(async () => {
        if (!settings.reminders_paused) {
          await api.sendReminder();
        }
        schedule();
      }, intervalMs);
    };

    schedule();
    return () => {
      if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    };
  }, [settings?.reminder_interval_min, settings?.reminders_paused]);

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
