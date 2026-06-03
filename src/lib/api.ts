import { invoke } from "@tauri-apps/api/core";

export interface Settings {
  onboarding_complete: boolean;
  weight_kg: number;
  activity_level: string;
  climate: string;
  daily_goal_ml: number;
  reminder_interval_min: number;
  notification_personality: string;
  smart_mode: boolean;
  reminders_paused: boolean;
  autostart: boolean;
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

export const api = {
  getSettings: () => invoke<Settings>("get_settings"),

  saveSettings: (params: {
    weight_kg: number;
    activity_level: string;
    climate: string;
    reminder_interval_min: number;
    notification_personality: string;
    smart_mode: boolean;
    autostart: boolean;
  }) => invoke<number>("save_settings", params),

  completeOnboarding: (params: {
    weight_kg: number;
    activity_level: string;
    climate: string;
  }) => invoke<number>("complete_onboarding", params),

  getTodayStats: () => invoke<TodayStats>("get_today_stats"),

  logDrink: (amount_ml: number) => invoke<TodayStats>("log_drink", { amount_ml }),

  confirmReminder: (reminder_id: number, amount_ml: number) =>
    invoke<TodayStats>("confirm_reminder", { reminder_id, amount_ml }),

  getWeekStats: () => invoke<DayStats[]>("get_week_stats"),

  getMonthStats: () => invoke<DayStats[]>("get_month_stats"),

  getAchievements: () => invoke<Achievement[]>("get_achievements_list"),

  calculateGoal: (weight_kg: number, activity_level: string, climate: string) =>
    invoke<number>("calculate_goal_cmd", { weight_kg, activity_level, climate }),

  setRemindersPaused: (paused: boolean) =>
    invoke<void>("set_reminders_paused", { paused }),

  sendReminder: () => invoke<void>("send_reminder"),

  getLastReminderId: () => invoke<number | null>("get_last_reminder_id"),
};
