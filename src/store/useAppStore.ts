import { create } from "zustand";
import { api, Settings, TodayStats, DayStats, Achievement } from "../lib/api";

interface ReminderNotif {
  id: number;
  phrase: string;
  suggested_ml: number;
}

interface AppStore {
  settings: Settings | null;
  todayStats: TodayStats | null;
  weekStats: DayStats[];
  monthStats: DayStats[];
  achievements: Achievement[];
  reminderNotif: ReminderNotif | null;
  loading: boolean;

  loadSettings: () => Promise<void>;
  loadTodayStats: () => Promise<void>;
  loadWeekStats: () => Promise<void>;
  loadMonthStats: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  logDrink: (ml: number) => Promise<void>;
  confirmReminder: (id: number, ml: number) => Promise<void>;
  saveSettings: (s: Partial<Settings>) => Promise<void>;
  completeOnboarding: (weight: number, activity: string, climate: string) => Promise<void>;
  setReminderNotif: (n: ReminderNotif | null) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  settings: null,
  todayStats: null,
  weekStats: [],
  monthStats: [],
  achievements: [],
  reminderNotif: null,
  loading: false,

  loadSettings: async () => {
    const settings = await api.getSettings();
    set({ settings });
  },

  loadTodayStats: async () => {
    const todayStats = await api.getTodayStats();
    set({ todayStats });
  },

  loadWeekStats: async () => {
    const weekStats = await api.getWeekStats();
    set({ weekStats });
  },

  loadMonthStats: async () => {
    const monthStats = await api.getMonthStats();
    set({ monthStats });
  },

  loadAchievements: async () => {
    const achievements = await api.getAchievements();
    set({ achievements });
  },

  logDrink: async (ml: number) => {
    const todayStats = await api.logDrink(ml);
    set({ todayStats });
  },

  confirmReminder: async (id: number, ml: number) => {
    const todayStats = await api.confirmReminder(id, ml);
    set({ todayStats, reminderNotif: null });
  },

  saveSettings: async (partial: Partial<Settings>) => {
    const current = get().settings;
    if (!current) return;
    const merged = { ...current, ...partial };
    await api.saveSettings({
      weight_kg: merged.weight_kg,
      activity_level: merged.activity_level,
      climate: merged.climate,
      reminder_interval_min: merged.reminder_interval_min,
      notification_personality: merged.notification_personality,
      smart_mode: merged.smart_mode,
      autostart: merged.autostart,
    });
    await get().loadSettings();
    await get().loadTodayStats();
  },

  completeOnboarding: async (weight: number, activity: string, climate: string) => {
    await api.completeOnboarding({ weight_kg: weight, activity_level: activity, climate });
    await get().loadSettings();
    await get().loadTodayStats();
  },

  setReminderNotif: (reminderNotif) => set({ reminderNotif }),
}));
