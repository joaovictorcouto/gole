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
  drinkTick: number;

  loadSettings: () => Promise<void>;
  loadTodayStats: () => Promise<void>;
  loadWeekStats: () => Promise<void>;
  loadMonthStats: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  reloadAll: () => Promise<void>;
  logDrink: (ml: number) => Promise<void>;
  confirmReminder: (id: number, ml: number) => Promise<void>;
  saveSettings: (s: Partial<Settings>) => Promise<void>;
  completeOnboarding: (
    weight: number,
    age: number,
    activity: string,
    climate: string,
    recipienteConfigurado: boolean,
    recipienteCapacidade: number,
    workStartHour?: string,
    workEndHour?: string,
    appMode?: string
  ) => Promise<void>;
  setReminderNotif: (n: ReminderNotif | null) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateLastCheckDate: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  settings: null,
  todayStats: null,
  weekStats: [],
  monthStats: [],
  achievements: [],
  reminderNotif: null,
  drinkTick: 0,
  theme: (localStorage.getItem('gole-theme') as 'light' | 'dark' | 'system') || 'system',

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

  reloadAll: async () => {
    const [settings, todayStats, weekStats, monthStats, achievements] = await Promise.all([
      api.getSettings(),
      api.getTodayStats(),
      api.getWeekStats(),
      api.getMonthStats(),
      api.getAchievements(),
    ]);
    set((s) => ({
      settings,
      todayStats,
      weekStats,
      monthStats,
      achievements,
      drinkTick: s.drinkTick + 1,
    }));
  },

  logDrink: async (ml: number) => {
    const todayStats = await api.logDrink(ml);
    set((s) => ({ todayStats, drinkTick: s.drinkTick + 1 }));
  },

  confirmReminder: async (id: number, ml: number) => {
    const todayStats = await api.confirmReminder(id, ml);
    set((s) => ({ todayStats, reminderNotif: null, drinkTick: s.drinkTick + 1 }));
  },

  saveSettings: async (partial: Partial<Settings>) => {
    const current = get().settings;
    if (!current) return;
    const merged = { ...current, ...partial };
    await api.saveSettings({
      weight_kg: merged.weight_kg,
      age_years: merged.age_years,
      activity_level: merged.activity_level,
      climate: merged.climate,
      reminder_interval_min: merged.reminder_interval_min,
      notification_personality: merged.notification_personality,
      smart_mode: merged.smart_mode,
      reminders_paused: merged.reminders_paused,
      autostart: merged.autostart,
      recipiente_configurado: merged.recipiente_configurado,
      recipiente_capacidade_ml: merged.recipiente_capacidade_ml,
      sound_preset: merged.sound_preset,
      sound_volume: merged.sound_volume,
      work_start_hour: merged.work_start_hour || "08:00",
      work_end_hour: merged.work_end_hour || "18:00",
      sip_ml: merged.sip_ml || 20,
      app_mode: merged.app_mode || "pro",
    });
    await get().loadSettings();
    await get().loadTodayStats();
  },

  completeOnboarding: async (
    weight: number,
    age: number,
    activity: string,
    climate: string,
    recipienteConfigurado: boolean,
    recipienteCapacidade: number,
    workStartHour: string = "08:00",
    workEndHour: string = "18:00",
    appMode: string = "pro"
  ) => {
    await api.completeOnboarding({
      weight_kg: weight,
      age_years: age,
      activity_level: activity,
      climate,
      recipiente_configurado: recipienteConfigurado,
      recipiente_capacidade_ml: recipienteCapacidade,
      work_start_hour: workStartHour,
      work_end_hour: workEndHour,
      app_mode: appMode,
    });
    await get().loadSettings();
    await get().loadTodayStats();
  },

  setReminderNotif: (reminderNotif) => set({ reminderNotif }),

  setTheme: (theme) => {
    localStorage.setItem('gole-theme', theme);
    set({ theme });
  },

  updateLastCheckDate: async () => {
    await api.updateLastCheckDate();
    await get().loadSettings();
  },
}));
