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
  drinkTick: number;

  loadSettings: () => Promise<void>;
  loadTodayStats: () => Promise<void>;
  loadWeekStats: () => Promise<void>;
  loadMonthStats: () => Promise<void>;
  loadAchievements: () => Promise<void>;
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
    workEndHour?: string
  ) => Promise<void>;
  setReminderNotif: (n: ReminderNotif | null) => void;
  updateLastCheckDate: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  settings: null,
  todayStats: null,
  weekStats: [],
  monthStats: [],
  achievements: [],
  reminderNotif: null,
  loading: false,
  drinkTick: 0,

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
    workEndHour: string = "18:00"
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
    });
    await get().loadSettings();
    await get().loadTodayStats();
  },

  setReminderNotif: (reminderNotif) => set({ reminderNotif }),

  updateLastCheckDate: async () => {
    await api.updateLastCheckDate();
    await get().loadSettings();
  },
}));
