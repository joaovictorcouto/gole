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
  work_start_hour: string;
  work_end_hour: string;
  sip_ml: number;
  next_override_at: string;
  next_override_ml: number;
  app_mode: string;
  weather_enabled: boolean;
  weather_city: string;
  weather_api_key: string;
}

export interface ScheduleEntry {
  time: string;
  amount_ml: number;
  sips: number;
  status: "confirmed" | "missed" | "next" | "upcoming";
  reminder_id: number | null;
  is_override: boolean;
}

export interface ScheduleData {
  past: ScheduleEntry[];
  next: ScheduleEntry | null;
  upcoming: ScheduleEntry[];
  work_start: string;
  work_end: string;
  interval_min: number;
  sip_ml: number;
  has_override: boolean;
  override_at: string;
  override_ml: number;
}

export interface DailyModifier {
  ml_extra: number;
  motivo: string;
}

export interface DailyMission {
  id: number;
  date: string;
  description: string;
  target_ml: number;
  current_ml: number;
  is_completed: boolean;
  mission_type: string;
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
  next_reminder_at?: string;
  modifiers?: DailyModifier[];
  daily_mission?: DailyMission | null;
  weather?: WeatherInfo | null;
  goal_expediente_ml?: number;
  goal_fora_expediente_ml?: number;
}

export interface WeatherInfo {
  temp: number;
  condition: string;
  description: string;
  icon: string;
  last_updated: string;
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
    reminders_paused: boolean;
    autostart: boolean;
    recipiente_configurado: boolean;
    recipiente_capacidade_ml: number;
    sound_preset: string;
    sound_volume: number;
    work_start_hour: string;
    work_end_hour: string;
    sip_ml: number;
    app_mode: string;
    weather_enabled: boolean;
    weather_city: string;
    weather_api_key: string;
  }) => invoke<number>("save_settings", {
    weightKg: params.weight_kg,
    ageYears: params.age_years,
    activityLevel: params.activity_level,
    climate: params.climate,
    reminderIntervalMin: params.reminder_interval_min,
    notificationPersonality: params.notification_personality,
    smartMode: params.smart_mode,
    remindersPaused: params.reminders_paused,
    autostart: params.autostart,
    recipienteConfigurado: params.recipiente_configurado,
    recipienteCapacidadeMl: params.recipiente_capacidade_ml,
    soundPreset: params.sound_preset,
    soundVolume: params.sound_volume,
    workStartHour: params.work_start_hour,
    workEndHour: params.work_end_hour,
    sipMl: params.sip_ml,
    appMode: params.app_mode,
    weatherEnabled: params.weather_enabled,
    weatherCity: params.weather_city,
    weatherApiKey: params.weather_api_key,
  }),

  completeOnboarding: (params: {
    weight_kg: number;
    age_years: number;
    activity_level: string;
    climate: string;
    recipiente_configurado: boolean;
    recipiente_capacidade_ml: number;
    work_start_hour: string;
    work_end_hour: string;
    app_mode: string;
  }) => invoke<number>("complete_onboarding", {
    weightKg: params.weight_kg,
    ageYears: params.age_years,
    activityLevel: params.activity_level,
    climate: params.climate,
    recipienteConfigurado: params.recipiente_configurado,
    recipienteCapacidadeMl: params.recipiente_capacidade_ml,
    workStartHour: params.work_start_hour,
    workEndHour: params.work_end_hour,
    appMode: params.app_mode,
  }),

  getTodayStats: () => invoke<TodayStats>("get_today_stats"),
  getDailySuccessRate: () => invoke<number>("get_daily_success_rate"),
  getTodayRemindersList: () => invoke<ReminderRow[]>("get_today_reminders_list"),
  toggleReminderStatus: (id: number) => invoke<void>("toggle_reminder_status", { id }),
  deleteReminder: (id: number) => invoke<void>("delete_reminder", { id }),
  addCustomReminder: (sentAt: string, confirmed: boolean) =>
    invoke<void>("add_custom_reminder", { sentAt, confirmed }),

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

  sendReminder: (force?: boolean) => invoke<void>("send_reminder", { force }),

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

  updateDrink: (id: number, amount_ml: number, logged_at: string): Promise<TodayStats> =>
    invoke("update_drink", { id, amountMl: amount_ml, loggedAt: logged_at }),

  deleteDrink: (id: number): Promise<TodayStats> => invoke("delete_drink", { id }),

  installSilentUpdate: (url: string): Promise<void> =>
    invoke("install_silent_update", { url }),

  getReminderSchedule: () => invoke<ScheduleData>("get_reminder_schedule"),

  setNextReminderOverride: (at: string, amount_ml: number) =>
    invoke<void>("set_next_reminder_override", { at, amountMl: amount_ml }),

  clearNextReminderOverride: () =>
    invoke<void>("clear_next_reminder_override"),

  snoozeReminder: (reminder_id: number, minutes = 5) =>
    invoke<void>("snooze_reminder", { reminderId: reminder_id, minutes }),

  verifyDevPassword: (password: string) =>
    invoke<boolean>("verify_dev_password", { password }),
  computeDevPasswordHash: (password: string) =>
    invoke<string>("compute_dev_password_hash", { password }),
  devGateAvailable: () => invoke<boolean>("dev_gate_available"),

  setTodayTotal: (target_ml: number) =>
    invoke<TodayStats>("set_today_total", { targetMl: target_ml }),

  exportHistoryCsv: (filepath: string) =>
    invoke<void>("export_history_csv", { filepath }),
};

export interface DrinkLog {
  id: number;
  amount_ml: number;
  logged_at: string;
}

export interface ReminderRow {
  id: number;
  sent_at: string;
  confirmed: boolean;
}
