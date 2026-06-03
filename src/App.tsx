import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "./store/useAppStore";
import { SideNav } from "./components/ui/SideNav";
import { ReminderToast } from "./components/ui/ReminderToast";
import { Welcome } from "./pages/onboarding/Welcome";
import { Weight } from "./pages/onboarding/Weight";
import { Activity } from "./pages/onboarding/Activity";
import { Climate } from "./pages/onboarding/Climate";
import { Result } from "./pages/onboarding/Result";
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

function OnboardingFlow() {
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState("sedentary");
  const [climate, setClimate] = useState("temperate");
  const [goal, setGoal] = useState(2450);

  const updateGoal = async (w: number, a: string, c: string) => {
    const g = await api.calculateGoal(w, a, c);
    setGoal(g);
  };

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/weight" element={
        <Weight
          initialWeight={weight}
          onWeight={(w) => { setWeight(w); updateGoal(w, activity, climate); }}
        />
      } />
      <Route path="/activity" element={
        <Activity
          initialActivity={activity}
          onActivity={(a) => { setActivity(a); updateGoal(weight, a, climate); }}
        />
      } />
      <Route path="/climate" element={
        <Climate
          initialClimate={climate}
          onClimate={(c) => { setClimate(c); updateGoal(weight, activity, c); }}
        />
      } />
      <Route path="/result" element={
        <Result weight={weight} activity={activity} climate={climate} goal={goal} />
      } />
    </Routes>
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
        <Route path="/onboarding/*" element={<OnboardingFlow />} />

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
