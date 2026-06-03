import { invoke } from "@tauri-apps/api/core";

export interface Settings {
  onboarding_complete: boolean;
  weight_kg: number;
  age_years: number;
  activity_level: string;
  climate: string;
  daily_goal_ml: number;
  reminder_interval_min: number;
  notification_personality: string;
  smart_mode: boolean;
  reminders_paused: boolean;
  autostart: boolean;
  last_data_check_date: string;
  recipiente_configurado: boolean;
  recipiente_capacidade_ml: number;
  sound_preset: string;
  sound_volume: number;
}

export interface TodayStats {
  date: string;
  goal_ml: number;
  consumed_ml: number;
  remaining_ml: number;
  percent: number;
  streak: number;
  reminders_sent: number;
  reminders_confirmed: number;
  suggested_per_reminder: number;
}

export interface DayStats {
  date: string;
  goal_ml: number;
  consumed_ml: number;
  reminders_sent: number;
  reminders_confirmed: number;
}

export interface Achievement {
  id: string;
  unlocked_at: string | null;
}

export interface Phrase {
  id: number;
  text: string;
  category: string;
  favorite: boolean;
  is_custom: boolean;
}

export const api = {
  getSettings: () => invoke<Settings>("get_settings"),

  saveSettings: (params: {
    weight_kg: number;
    age_years: number;
    activity_level: string;
    climate: string;
    reminder_interval_min: number;
    notification_personality: string;
    smart_mode: boolean;
    autostart: boolean;
    recipiente_configurado: boolean;
    recipiente_capacidade_ml: number;
    sound_preset: string;
    sound_volume: number;
  }) => invoke<number>("save_settings", {
    weightKg: params.weight_kg,
    ageYears: params.age_years,
    activityLevel: params.activity_level,
    climate: params.climate,
    reminderIntervalMin: params.reminder_interval_min,
    notificationPersonality: params.notification_personality,
    smartMode: params.smart_mode,
    autostart: params.autostart,
    recipienteConfigurado: params.recipiente_configurado,
    recipienteCapacidadeMl: params.recipiente_capacidade_ml,
    soundPreset: params.sound_preset,
    soundVolume: params.sound_volume,
  }),

  completeOnboarding: (params: {
    weight_kg: number;
    age_years: number;
    activity_level: string;
    climate: string;
    recipiente_configurado: boolean;
    recipiente_capacidade_ml: number;
  }) => invoke<number>("complete_onboarding", {
    weightKg: params.weight_kg,
    ageYears: params.age_years,
    activityLevel: params.activity_level,
    climate: params.climate,
    recipienteConfigurado: params.recipiente_configurado,
    recipienteCapacidadeMl: params.recipiente_capacidade_ml,
  }),

  getTodayStats: () => invoke<TodayStats>("get_today_stats"),

  logDrink: (amount_ml: number) => invoke<TodayStats>("log_drink", { amountMl: amount_ml }),

  confirmReminder: (reminder_id: number, amount_ml: number) =>
    invoke<TodayStats>("confirm_reminder", { reminderId: reminder_id, amountMl: amount_ml }),

  getWeekStats: () => invoke<DayStats[]>("get_week_stats"),

  getMonthStats: () => invoke<DayStats[]>("get_month_stats"),

  getRangeStats: (start_date: string, end_date: string) =>
    invoke<DayStats[]>("get_range_stats", { startDate: start_date, endDate: end_date }),

  getAchievements: () => invoke<Achievement[]>("get_achievements_list"),

  calculateGoal: (weight_kg: number, activity_level: string, climate: string) =>
    invoke<number>("calculate_goal_cmd", {
      weightKg: weight_kg,
      activityLevel: activity_level,
      climate,
    }),

  setRemindersPaused: (paused: boolean) =>
    invoke<void>("set_reminders_paused", { paused }),

  sendReminder: () => invoke<void>("send_reminder"),

  getLastReminderId: () => invoke<number | null>("get_last_reminder_id"),

  updateLastCheckDate: () => invoke<void>("update_last_check_date"),

  getAllPhrases: () => invoke<Phrase[]>("get_all_phrases"),

  toggleFavoritePhrase: (id: number, favorite: boolean) =>
    invoke<void>("toggle_favorite_phrase", { id, favorite }),

  createCustomPhrase: (text: string) => invoke<void>("create_custom_phrase", { text }),

  updateCustomPhrase: (id: number, text: string) => invoke<void>("update_custom_phrase", { id, text }),

  deleteCustomPhrase: (id: number) => invoke<void>("delete_custom_phrase", { id }),

  deleteLastDrink: () => invoke<TodayStats>("delete_last_drink"),

  getTodayDrinks: (): Promise<DrinkLog[]> => invoke("get_today_drinks"),

  getDrinksForDate: (date: string): Promise<DrinkLog[]> =>
    invoke("get_drinks_for_date", { date }),

  logDrinkAt: (amount_ml: number, logged_at: string): Promise<TodayStats> =>
    invoke("log_drink_at", { amountMl: amount_ml, loggedAt: logged_at }),

  updateDrink: (id: number, amount_ml: number): Promise<TodayStats> =>
    invoke("update_drink", { id, amountMl: amount_ml }),

  deleteDrink: (id: number): Promise<TodayStats> => invoke("delete_drink", { id }),
};

export interface DrinkLog {
  id: number;
  amount_ml: number;
  logged_at: string;
}
