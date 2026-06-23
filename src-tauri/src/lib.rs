mod db;
mod hydration;
mod dev_gate;

use std::sync::{Mutex, Arc};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State, AppHandle, Emitter, WindowEvent, WebviewUrl, WebviewWindowBuilder, PhysicalPosition};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use chrono::Local;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Reminder {
    id: i64,
    phrase: String,
    suggested_ml: i64,
    consumed_ml: i64,
    remaining_ml: i64,
    container_text: String,
    suggested_sips: i64,
    sip_ml: i64,
    is_test: bool,
    app_mode: String,
    snooze_count: u8,
}

fn is_fullscreen(app: &AppHandle) -> bool {
    let monitor = match app.primary_monitor() {
        Ok(Some(m)) => m,
        _ => return false,
    };
    let scale_factor = monitor.scale_factor();
    let monitor_size = monitor.size(); // PhysicalSize<u32>

    let monitor_log_width = monitor_size.width as f64 / scale_factor;
    let monitor_log_height = monitor_size.height as f64 / scale_factor;

    match active_win_pos_rs::get_active_window() {
        Ok(active_window) => {
            let win_width = active_window.position.width;
            let win_height = active_window.position.height;

            let diff_w = (win_width - monitor_log_width).abs();
            let diff_h = (win_height - monitor_log_height).abs();

            diff_w < 5.0 && diff_h < 5.0
        }
        Err(_) => false,
    }
}

struct AppState {
    conn: Mutex<Connection>,
    last_reminder_id: Mutex<Option<i64>>,
    tray_drink_item: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
    snooze_count: Mutex<u8>,
}

fn drink_label(amount: i64) -> String {
    format!("💧 Beber água agora (+{}ml)", amount)
}

/// Primary monitor work area (screen minus taskbars / docked appbars / palettes).
/// Returns physical-pixel rect (left, top, right, bottom) or None on failure.
#[cfg(windows)]
fn get_work_area_rect(scale: f64) -> Option<(i32, i32, i32, i32)> {
    #[repr(C)]
    #[derive(Default, Copy, Clone)]
    struct RECT { left: i32, top: i32, right: i32, bottom: i32 }
    extern "system" {
        fn SystemParametersInfoW(
            ui_action: u32,
            ui_param: u32,
            pv_param: *mut core::ffi::c_void,
            f_win_ini: u32,
        ) -> i32;
    }
    const SPI_GETWORKAREA: u32 = 0x0030;
    unsafe {
        let mut rect = RECT::default();
        let ok = SystemParametersInfoW(
            SPI_GETWORKAREA, 0,
            &mut rect as *mut _ as *mut core::ffi::c_void, 0,
        );
        if ok == 0 { return None; }
        // SPI_GETWORKAREA returns logical (DIP) units relative to the primary monitor.
        // Convert to physical pixels.
        Some((
            (rect.left   as f64 * scale) as i32,
            (rect.top    as f64 * scale) as i32,
            (rect.right  as f64 * scale) as i32,
            (rect.bottom as f64 * scale) as i32,
        ))
    }
}

#[cfg(not(windows))]
fn get_work_area_rect(_scale: f64) -> Option<(i32, i32, i32, i32)> { None }

fn position_reminder_window(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let win_w = (360.0 * scale) as i32;
        let win_h = (200.0 * scale) as i32;
        let margin = (16.0 * scale) as i32;
        let safety = (8.0 * scale) as i32; // extra gap above whatever bar sits at the bottom

        // Prefer the OS-reported work area (excludes taskbar + docked appbars
        // like command palettes). Fall back to a fixed taskbar guess if the
        // call fails.
        let (right, bottom) = if let Some((_l, _t, r, b)) = get_work_area_rect(scale) {
            (r, b)
        } else {
            let taskbar_gap = (48.0 * scale) as i32;
            (size.width as i32, size.height as i32 - taskbar_gap)
        };

        let x = (right - win_w - margin).max(0);
        let y = (bottom - win_h - margin - safety).max(0);
        let _ = window.set_position(PhysicalPosition::new(x, y));
    }
}

/// Computes the next scheduled fire datetime for today.
/// Honors override; otherwise rolls last_fire+interval forward until > now.
/// Returns None if no slot fits within today's work window.
fn compute_next_slot(conn: &Connection) -> Option<chrono::NaiveDateTime> {
    let settings = db::get_settings(conn).ok()?;
    let now = Local::now().naive_local();
    let date = Local::now().format("%Y-%m-%d").to_string();
    let rows = db::list_today_reminders(conn, &date).ok()?;

    let start_time = chrono::NaiveTime::parse_from_str(&settings.work_start_hour, "%H:%M")
        .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(8, 0, 0).unwrap());
    let end_time = chrono::NaiveTime::parse_from_str(&settings.work_end_hour, "%H:%M")
        .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(18, 0, 0).unwrap());

    if !settings.next_override_at.is_empty() {
        if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(&settings.next_override_at, "%Y-%m-%dT%H:%M:%S") {
            if dt > now { return Some(dt); }
        }
    }

    let today_start = Local::now().date_naive().and_time(start_time);
    let today_end = Local::now().date_naive().and_time(end_time);
    let last_fire = rows.last().and_then(|r| chrono::NaiveDateTime::parse_from_str(&r.sent_at, "%Y-%m-%dT%H:%M:%S").ok());
    let mut t = match last_fire {
        Some(t) => t + chrono::Duration::minutes(settings.reminder_interval_min),
        None => if now < today_start { today_start } else { now + chrono::Duration::minutes(settings.reminder_interval_min) },
    };
    while t <= now {
        t = t + chrono::Duration::minutes(settings.reminder_interval_min);
    }
    if t <= today_end { Some(t) } else { None }
}

fn emit_schedule_changed(app: &AppHandle) {
    let _ = app.emit("schedule_changed", ());
}

fn current_suggested_amount(conn: &Connection) -> i64 {
    let settings = match db::get_settings(conn) {
        Ok(s) => s,
        Err(_) => return 250,
    };
    if settings.next_override_ml > 0 {
        return settings.next_override_ml;
    }
    
    let date = Local::now().format("%Y-%m-%d").to_string();
    let rows = db::list_today_reminders(conn, &date).unwrap_or_default();
    let consumed = db::get_today_consumed(conn, &date).unwrap_or(0);
    
    let now = Local::now();
    let start_time = chrono::NaiveTime::parse_from_str(&settings.work_start_hour, "%H:%M")
        .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(8, 0, 0).unwrap());
    let end_time = chrono::NaiveTime::parse_from_str(&settings.work_end_hour, "%H:%M")
        .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(18, 0, 0).unwrap());
        
    let last_fire = rows.last().and_then(|r| chrono::NaiveDateTime::parse_from_str(&r.sent_at, "%Y-%m-%dT%H:%M:%S").ok());
    let now_naive = now.naive_local();
    let mut base_next = match last_fire {
        Some(t) => t + chrono::Duration::minutes(settings.reminder_interval_min),
        None => {
            let today_start = now.date_naive().and_time(start_time);
            if now_naive < today_start { today_start } else { now_naive + chrono::Duration::minutes(settings.reminder_interval_min) }
        }
    };
    while base_next <= now_naive {
        base_next = base_next + chrono::Duration::minutes(settings.reminder_interval_min);
    }
    
    let next_at = base_next;
    let today_end = now.date_naive().and_time(end_time);
    
    let next_exists = next_at <= today_end;
    if !next_exists {
        return hydration::suggested_per_reminder(
            settings.daily_goal_ml,
            settings.reminder_interval_min,
            &settings.work_start_hour,
            &settings.work_end_hour,
            settings.sip_ml,
        );
    }
    
    let mut upcoming_count = 0;
    let mut t = next_at + chrono::Duration::minutes(settings.reminder_interval_min);
    while t <= today_end {
        upcoming_count += 1;
        t = t + chrono::Duration::minutes(settings.reminder_interval_min);
    }
    
    let total_remaining_slots = 1 + upcoming_count;
    
    let dyn_sips = hydration::sips_per_remaining_slot(
        settings.daily_goal_ml, consumed, settings.sip_ml, total_remaining_slots,
    );
    let dyn_ml = dyn_sips * settings.sip_ml.max(1);
    
    if dyn_ml > 0 {
        dyn_ml
    } else {
        hydration::suggested_per_reminder(
            settings.daily_goal_ml,
            settings.reminder_interval_min,
            &settings.work_start_hour,
            &settings.work_end_hour,
            settings.sip_ml,
        )
    }
}

fn refresh_tray_drink_label(app: &AppHandle) {
    if let Some(state) = app.try_state::<AppState>() {
        let (amount, is_basic) = {
            let conn = state.conn.lock().unwrap();
            let amount = current_suggested_amount(&conn);
            let is_basic = db::get_settings(&conn)
                .map(|s| s.app_mode == "basic")
                .unwrap_or(false);
            (amount, is_basic)
        };
        if let Some(item) = state.tray_drink_item.lock().unwrap().as_ref() {
            if is_basic {
                let _ = item.set_text("💧 Beber água agora");
            } else {
                let _ = item.set_text(drink_label(amount));
            }
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct WeatherInfo {
    temp: f64,
    condition: String,
    description: String,
    icon: String,
    last_updated: String,
}

#[derive(Serialize, Deserialize)]
struct TodayStats {
    date: String,
    goal_ml: i64,
    consumed_ml: i64,
    remaining_ml: i64,
    percent: f64,
    streak: i64,
    reminders_sent: i64,
    reminders_confirmed: i64,
    suggested_per_reminder: i64,
    next_reminder_at: Option<String>,
    modifiers: Option<Vec<db::DailyModifier>>,
    daily_mission: Option<db::DailyMission>,
    weather: Option<WeatherInfo>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Achievement {
    id: String,
    unlocked_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PhraseInfo {
    pub id: i64,
    pub text: String,
    pub category: String,
    pub favorite: bool,
    pub is_custom: bool,
}

#[tauri::command]
fn get_settings(state: State<AppState>) -> Result<db::Settings, String> {
    let conn = state.conn.lock().unwrap();
    db::get_settings(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_settings(
    state: State<AppState>,
    app: AppHandle,
    weight_kg: f64,
    age_years: i64,
    activity_level: String,
    climate: String,
    reminder_interval_min: i64,
    notification_personality: String,
    smart_mode: bool,
    reminders_paused: bool,
    autostart: bool,
    recipiente_configurado: bool,
    recipiente_capacidade_ml: i64,
    sound_preset: String,
    sound_volume: i64,
    work_start_hour: String,
    work_end_hour: String,
    sip_ml: i64,
    app_mode: String,
    weather_enabled: bool,
    weather_city: String,
    weather_api_key: String,
) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let goal = if app_mode == "basic" { 0 } else { hydration::calculate_goal(weight_kg, &activity_level, &climate) };
    db::set_setting(&conn, "app_mode", &app_mode).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "weight_kg", &weight_kg.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "age_years", &age_years.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "activity_level", &activity_level).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "climate", &climate).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "daily_goal_ml", &goal.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "reminder_interval_min", &reminder_interval_min.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "notification_personality", &notification_personality).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "smart_mode", if smart_mode { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "reminders_paused", if reminders_paused { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "autostart", if autostart { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "recipiente_configurado", if recipiente_configurado { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "recipiente_capacidade_ml", &recipiente_capacidade_ml.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "sound_preset", &sound_preset).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "sound_volume", &sound_volume.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "work_start_hour", &work_start_hour).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "work_end_hour", &work_end_hour).map_err(|e| e.to_string())?;
    let sip_ml = if sip_ml > 0 { sip_ml } else { 20 };
    db::set_setting(&conn, "sip_ml", &sip_ml.to_string()).map_err(|e| e.to_string())?;

    // Criptografa a chave da API do OpenWeather antes de salvar
    let encrypted_key = db::encrypt_key(&weather_api_key);
    db::set_setting(&conn, "weather_enabled", if weather_enabled { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "weather_city", &weather_city).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "weather_api_key", &encrypted_key).map_err(|e| e.to_string())?;

    // Configura o sistema operacional para iniciar com o Windows ou não
    use tauri_plugin_autostart::ManagerExt;
    let autostart_manager = app.autolaunch();
    if autostart {
        let _ = autostart_manager.enable();
    } else {
        let _ = autostart_manager.disable();
    }

    drop(conn);
    refresh_tray_drink_label(&app);
    Ok(goal)
}

#[tauri::command]
fn get_today_drinks(state: State<AppState>) -> Result<Vec<db::DrinkLog>, String> {
    let date = Local::now().format("%Y-%m-%d").to_string();
    let conn = state.conn.lock().unwrap();
    db::get_today_drinks(&conn, &date).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_drinks_for_date(state: State<AppState>, date: String) -> Result<Vec<db::DrinkLog>, String> {
    let conn = state.conn.lock().unwrap();
    db::get_today_drinks(&conn, &date).map_err(|e| e.to_string())
}

/// Log a drink at a specific date+time. `logged_at` is ISO `YYYY-MM-DDTHH:MM:SS`.
#[tauri::command]
fn log_drink_at(state: State<AppState>, app: AppHandle, amount_ml: i64, logged_at: String) -> Result<TodayStats, String> {
    let date = logged_at.get(0..10).unwrap_or("").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::log_drink(&conn, &date, amount_ml, &logged_at).map_err(|e| e.to_string())?;
        
        let today = Local::now().format("%Y-%m-%d").to_string();
        if date == today {
            if let Some(time_part) = logged_at.split('T').nth(1) {
                if let Some(hour_str) = time_part.split(':').next() {
                    if let Ok(hour) = hour_str.parse::<u32>() {
                        db::update_daily_mission_progress(&conn, &date, amount_ml, hour).ok();
                    }
                }
            }
        }
    }
    check_achievements_internal(&state)?;
    emit_schedule_changed(&app);
    get_today_stats(state)
}

#[tauri::command]
fn update_drink(state: State<AppState>, app: AppHandle, id: i64, amount_ml: i64, logged_at: String) -> Result<TodayStats, String> {
    {
        let conn = state.conn.lock().unwrap();
        db::update_drink(&conn, id, amount_ml, &logged_at).map_err(|e| e.to_string())?;
    }
    emit_schedule_changed(&app);
    get_today_stats(state)
}

#[tauri::command]
fn delete_drink(state: State<AppState>, app: AppHandle, id: i64) -> Result<TodayStats, String> {
    {
        let conn = state.conn.lock().unwrap();
        db::delete_drink(&conn, id).map_err(|e| e.to_string())?;
    }
    emit_schedule_changed(&app);
    get_today_stats(state)
}

/// Sets today's total consumed to `target_ml` by inserting a single drink
/// row for the positive difference. Refuses if target is below current
/// consumption (use history edit for that). Emits schedule_changed so
/// future slots recalc to hit the meta exactly.
#[tauri::command]
fn set_today_total(state: State<AppState>, app: AppHandle, target_ml: i64) -> Result<TodayStats, String> {
    if target_ml < 0 { return Err("Valor inválido.".into()); }
    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();
    {
        let conn = state.conn.lock().unwrap();
        let current = db::get_today_consumed(&conn, &date).map_err(|e| e.to_string())?;
        let diff = target_ml - current;
        if diff > 0 {
            db::log_drink(&conn, &date, diff, &logged_at).map_err(|e| e.to_string())?;
        } else if diff < 0 {
            return Err("Total informado é menor que o já consumido. Edite pelo histórico.".into());
        }
    }
    check_achievements_internal(&state)?;
    emit_schedule_changed(&app);
    get_today_stats(state)
}

#[tauri::command]
fn delete_last_drink(state: State<AppState>, app: AppHandle) -> Result<TodayStats, String> {
    let date = Local::now().format("%Y-%m-%d").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::delete_last_drink(&conn, &date).map_err(|e| e.to_string())?;
    }
    emit_schedule_changed(&app);
    get_today_stats(state)
}

#[tauri::command]
fn complete_onboarding(
    state: State<AppState>,
    app: AppHandle,
    weight_kg: f64,
    age_years: i64,
    activity_level: String,
    climate: String,
    recipiente_configurado: bool,
    recipiente_capacidade_ml: i64,
    work_start_hour: String,
    work_end_hour: String,
    app_mode: String,
) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let goal = if app_mode == "basic" { 0 } else { hydration::calculate_goal(weight_kg, &activity_level, &climate) };

    db::set_setting(&conn, "app_mode", &app_mode).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "weight_kg", &weight_kg.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "age_years", &age_years.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "activity_level", &activity_level).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "climate", &climate).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "daily_goal_ml", &goal.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "recipiente_configurado", if recipiente_configurado { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "recipiente_capacidade_ml", &recipiente_capacidade_ml.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "work_start_hour", &work_start_hour).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "work_end_hour", &work_end_hour).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "onboarding_complete", "true").map_err(|e| e.to_string())?;
    db::set_setting(&conn, "last_data_check_date", &Local::now().format("%Y-%m-%d").to_string()).map_err(|e| e.to_string())?;
    
    // Inicia com o Windows habilitado por padrão
    db::set_setting(&conn, "autostart", "true").map_err(|e| e.to_string())?;
    use tauri_plugin_autostart::ManagerExt;
    let autostart_manager = app.autolaunch();
    let _ = autostart_manager.enable();

    drop(conn);
    refresh_tray_drink_label(&app);
    Ok(goal)
}

#[tauri::command]
fn get_today_stats(state: State<AppState>) -> Result<TodayStats, String> {
    let conn = state.conn.lock().unwrap();
    let mut settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    let date = Local::now().format("%Y-%m-%d").to_string();

    // Auto-resume reminders if the day has changed
    let last_active: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'last_active_date'",
        [],
        |row| row.get(0),
    ).unwrap_or_default();
    if last_active != date {
        db::set_setting(&conn, "reminders_paused", "false").ok();
        db::set_setting(&conn, "last_active_date", &date).ok();
        settings.reminders_paused = false;
    }

    let consumed = db::get_today_consumed(&conn, &date).map_err(|e| e.to_string())?;
    
    let pro_mode = settings.app_mode == "pro";
    let modifiers_sum = if pro_mode {
        db::get_today_modifiers_sum(&conn, &date).unwrap_or(0)
    } else {
        0
    };
    let goal = settings.daily_goal_ml + modifiers_sum;

    let remaining = (goal - consumed).max(0);
    let percent = if goal > 0 { consumed as f64 / goal as f64 * 100.0 } else { 0.0 };
    let streak = db::get_streak(&conn, goal).map_err(|e| e.to_string())?;
    let (sent, confirmed) = db::get_today_reminders(&conn, &date).map_err(|e| e.to_string())?;
    let suggested = current_suggested_amount(&conn);
    let next_reminder_at = compute_next_slot(&conn).map(|t| t.format("%Y-%m-%dT%H:%M:%S").to_string());

    let modifiers = if pro_mode {
        db::get_today_modifiers(&conn, &date).ok()
    } else {
        None
    };

    let daily_mission = if pro_mode {
        db::get_daily_mission(&conn, &date).ok().flatten()
    } else {
        None
    };

    let get_setting = |key: &str| -> String {
        conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            [key],
            |row| row.get::<_, String>(0)
        ).unwrap_or_default()
    };

    let weather = if pro_mode && settings.weather_enabled {
        let temp_str = get_setting("weather_current_temp");
        let cond = get_setting("weather_current_condition");
        let desc = get_setting("weather_current_description");
        let icon = get_setting("weather_current_icon");
        let updated = get_setting("weather_last_updated");
        
        if !temp_str.is_empty() {
            if let Ok(temp) = temp_str.parse::<f64>() {
                Some(WeatherInfo {
                    temp,
                    condition: cond,
                    description: desc,
                    icon,
                    last_updated: updated,
                })
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    Ok(TodayStats {
        date,
        goal_ml: goal,
        consumed_ml: consumed,
        remaining_ml: remaining,
        percent: percent.min(100.0),
        streak,
        reminders_sent: sent,
        reminders_confirmed: confirmed,
        suggested_per_reminder: suggested,
        next_reminder_at,
        modifiers,
        daily_mission,
        weather,
    })
}

#[tauri::command]
fn log_drink(state: State<AppState>, app: AppHandle, amount_ml: i64) -> Result<TodayStats, String> {
    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::log_drink(&conn, &date, amount_ml, &logged_at).map_err(|e| e.to_string())?;
        try_consume_next_slot(&conn, &now.naive_local());
        
        use chrono::Timelike;
        let hour = now.hour();
        db::update_daily_mission_progress(&conn, &date, amount_ml, hour).ok();
    }
    {
        let mut count = state.snooze_count.lock().unwrap();
        *count = 0;
    }
    check_achievements_internal(&state)?;
    emit_schedule_changed(&app);
    get_today_stats(state)
}

/// If the next scheduled slot is within the absorption window (half the
/// interval) of `now`, create a confirmed reminder row for it so the
/// schedule recognizes the drink as fulfilling that slot.
fn try_consume_next_slot(conn: &Connection, now: &chrono::NaiveDateTime) {
    let settings = match db::get_settings(conn) {
        Ok(s) => s,
        Err(_) => return,
    };
    let next = match compute_next_slot(conn) {
        Some(t) => t,
        None => return,
    };
    let window_min = (settings.reminder_interval_min / 2).max(5);
    let delta = (next - *now).num_minutes();
    if delta >= 0 && delta <= window_min {
        let stamp = next.format("%Y-%m-%dT%H:%M:%S").to_string();
        let _ = conn.execute(
            "INSERT INTO reminders (sent_at, confirmed, snoozed) VALUES (?1, 1, 0)",
            rusqlite::params![stamp],
        );
        // Clear override if it pointed at this slot
        let _ = db::set_setting(conn, "next_override_at", "");
        let _ = db::set_setting(conn, "next_override_ml", "0");
    }
}

#[tauri::command]
fn confirm_reminder(state: State<AppState>, app: AppHandle, reminder_id: i64, amount_ml: i64) -> Result<TodayStats, String> {
    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::confirm_reminder(&conn, reminder_id).map_err(|e| e.to_string())?;
        db::log_drink(&conn, &date, amount_ml, &logged_at).map_err(|e| e.to_string())?;
        
        use chrono::Timelike;
        let hour = now.hour();
        db::update_daily_mission_progress(&conn, &date, amount_ml, hour).ok();
    }
    {
        let mut count = state.snooze_count.lock().unwrap();
        *count = 0;
    }
    check_achievements_internal(&state)?;
    emit_schedule_changed(&app);
    get_today_stats(state)
}

#[tauri::command]
fn snooze_reminder(state: State<AppState>, app: AppHandle, reminder_id: i64, minutes: Option<i64>) -> Result<(), String> {
    let mins = minutes.unwrap_or(5).max(1);
    let now = Local::now().naive_local();
    let target = now + chrono::Duration::minutes(mins);
    let target_str = target.format("%Y-%m-%dT%H:%M:%S").to_string();
    let conn = state.conn.lock().unwrap();
    db::snooze_reminder(&conn, reminder_id).map_err(|e| e.to_string())?;

    {
        let mut count = state.snooze_count.lock().unwrap();
        *count = count.saturating_add(1);
    }

    // Carry the original suggested ml into the override
    let settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    let mut override_ml = hydration::suggested_per_reminder(
        settings.daily_goal_ml, settings.reminder_interval_min,
        &settings.work_start_hour, &settings.work_end_hour, settings.sip_ml,
    );

    // Collision/fusion: if next scheduled slot is within 10min after target,
    // absorb its ml into the override and skip that slot by inserting a phantom
    // confirmed row at the slot's time (effectively consuming it).
    let next = compute_next_slot(&conn);
    if let Some(slot) = next {
        if slot > target && (slot - target).num_minutes() <= 10 {
            let slot_ml = hydration::suggested_per_reminder(
                settings.daily_goal_ml, settings.reminder_interval_min,
                &settings.work_start_hour, &settings.work_end_hour, settings.sip_ml,
            );
            override_ml += slot_ml;
            // No reminder row to mark for an un-fired future slot; absorbing
            // its ml into the override is enough. The schedule rebuilds from
            // last_fire+interval, so the next computed slot after the override
            // fires will naturally be one interval later.
        }
    }

    db::set_setting(&conn, "next_override_at", &target_str).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "next_override_ml", &override_ml.to_string()).map_err(|e| e.to_string())?;
    drop(conn);
    emit_schedule_changed(&app);
    Ok(())
}

#[tauri::command]
fn get_daily_success_rate(state: State<AppState>) -> Result<f32, String> {
    let conn = state.conn.lock().unwrap();
    let date = Local::now().format("%Y-%m-%d").to_string();
    let (sent, confirmed) = db::get_today_reminders(&conn, &date).map_err(|e| e.to_string())?;
    if sent == 0 {
        Ok(0.0)
    } else {
        Ok(confirmed as f32 / sent as f32)
    }
}

#[tauri::command]
fn get_today_reminders_list(state: State<AppState>) -> Result<Vec<db::ReminderRow>, String> {
    let conn = state.conn.lock().unwrap();
    let date = Local::now().format("%Y-%m-%d").to_string();
    db::list_today_reminders(&conn, &date).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_reminder_status(state: State<AppState>, app: AppHandle, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let current_confirmed: i64 = conn.query_row(
        "SELECT confirmed FROM reminders WHERE id = ?1",
        rusqlite::params![id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let new_confirmed = if current_confirmed == 1 { 0 } else { 1 };
    conn.execute(
        "UPDATE reminders SET confirmed = ?1 WHERE id = ?2",
        rusqlite::params![new_confirmed, id],
    ).map_err(|e| e.to_string())?;

    drop(conn);
    emit_schedule_changed(&app);
    let _ = app.emit("refresh_data", ());
    Ok(())
}

#[tauri::command]
fn delete_reminder(state: State<AppState>, app: AppHandle, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "DELETE FROM reminders WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    drop(conn);
    emit_schedule_changed(&app);
    let _ = app.emit("refresh_data", ());
    Ok(())
}

#[tauri::command]
fn add_custom_reminder(state: State<AppState>, app: AppHandle, sent_at: String, confirmed: bool) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let conf = if confirmed { 1 } else { 0 };
    conn.execute(
        "INSERT INTO reminders (sent_at, confirmed, snoozed) VALUES (?1, ?2, 0)",
        rusqlite::params![sent_at, conf],
    ).map_err(|e| e.to_string())?;

    drop(conn);
    emit_schedule_changed(&app);
    let _ = app.emit("refresh_data", ());
    Ok(())
}

#[tauri::command]
fn get_week_stats(state: State<AppState>) -> Result<Vec<db::DayStats>, String> {
    let conn = state.conn.lock().unwrap();
    let settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    db::get_week_stats(&conn, settings.daily_goal_ml).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_month_stats(state: State<AppState>) -> Result<Vec<db::DayStats>, String> {
    let conn = state.conn.lock().unwrap();
    let settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    db::get_month_stats(&conn, settings.daily_goal_ml).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_range_stats(state: State<AppState>, start_date: String, end_date: String) -> Result<Vec<db::DayStats>, String> {
    let conn = state.conn.lock().unwrap();
    let settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    db::get_range_stats(&conn, settings.daily_goal_ml, &start_date, &end_date).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_achievements_list(state: State<AppState>) -> Result<Vec<Achievement>, String> {
    // Re-check whenever the list is loaded so retroactive achievements unlock.
    let _ = check_achievements_internal(&state);
    let conn = state.conn.lock().unwrap();
    let list = db::get_achievements(&conn).map_err(|e| e.to_string())?;
    Ok(list.into_iter().map(|(id, unlocked_at)| Achievement { id, unlocked_at }).collect())
}

fn check_achievements_internal(state: &AppState) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    let now = Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let date = Local::now().format("%Y-%m-%d").to_string();
    let consumed = db::get_today_consumed(&conn, &date).map_err(|e| e.to_string())?;
    let goal = settings.daily_goal_ml;

    // First drink
    if consumed > 0 {
        let _ = db::unlock_achievement(&conn, "first_day", &now);
    }

    // Goal hit today
    if consumed >= goal {
        let _ = db::unlock_achievement(&conn, "goal_complete", &now);
    }

    // Streaks
    let streak = db::get_streak(&conn, goal).map_err(|e| e.to_string())?;
    if streak >= 3   { let _ = db::unlock_achievement(&conn, "streak_3", &now); }
    if streak >= 7   { let _ = db::unlock_achievement(&conn, "streak_7", &now); }
    if streak >= 14  { let _ = db::unlock_achievement(&conn, "streak_14", &now); }
    if streak >= 30  { let _ = db::unlock_achievement(&conn, "streak_30", &now); }
    if streak >= 100 { let _ = db::unlock_achievement(&conn, "streak_100", &now); }

    // Lifetime liters
    let total_liters = db::get_total_consumed_liters(&conn).map_err(|e| e.to_string())?;
    if total_liters >= 10.0  { let _ = db::unlock_achievement(&conn, "liters_10", &now); }
    if total_liters >= 50.0  { let _ = db::unlock_achievement(&conn, "liters_50", &now); }
    if total_liters >= 100.0 { let _ = db::unlock_achievement(&conn, "liters_100", &now); }
    if total_liters >= 500.0 { let _ = db::unlock_achievement(&conn, "liters_500", &now); }

    // Days using app (any logs)
    let active_days = db::distinct_days_with_logs(&conn).map_err(|e| e.to_string())?;
    if active_days >= 7  { let _ = db::unlock_achievement(&conn, "active_7", &now); }
    if active_days >= 30 { let _ = db::unlock_achievement(&conn, "active_30", &now); }

    // Days goal reached (any time, not consecutive)
    let goal_days = db::days_goal_reached_count(&conn, goal).map_err(|e| e.to_string())?;
    if goal_days >= 10  { let _ = db::unlock_achievement(&conn, "goal_10_days", &now); }
    if goal_days >= 50  { let _ = db::unlock_achievement(&conn, "goal_50_days", &now); }

    // Big single drink
    let max_drink = db::max_single_drink(&conn).map_err(|e| e.to_string())?;
    if max_drink >= 1000 { let _ = db::unlock_achievement(&conn, "big_gulp", &now); }

    // Early bird (drank before 7am)
    if db::has_drink_before_hour(&conn, 7).map_err(|e| e.to_string())? {
        let _ = db::unlock_achievement(&conn, "early_bird", &now);
    }

    // Night owl (drank at or after 22h)
    if db::has_drink_after_hour(&conn, 22).map_err(|e| e.to_string())? {
        let _ = db::unlock_achievement(&conn, "night_owl", &now);
    }

    // Overflow day (>=120% of goal)
    if db::has_overflow_day(&conn, goal).map_err(|e| e.to_string())? {
        let _ = db::unlock_achievement(&conn, "overflow_day", &now);
    }

    // Weekend warrior — Sat+Sun goal in same week
    if db::weekend_warrior(&conn, goal).map_err(|e| e.to_string())? {
        let _ = db::unlock_achievement(&conn, "weekend_warrior", &now);
    }

    Ok(())
}

#[tauri::command]
fn calculate_goal_cmd(weight_kg: f64, activity_level: String, climate: String) -> i64 {
    let base_goal = hydration::calculate_goal(weight_kg, &activity_level, &climate);
    let reminders_per_day = (16.0f64 * 60.0 / 60.0).floor() as i64; // default 60min interval = 16 reminders
    let suggested = (base_goal as f64 / reminders_per_day as f64).round() as i64;
    suggested * reminders_per_day
}

#[tauri::command]
fn set_reminders_paused(state: State<AppState>, paused: bool) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    db::set_setting(&conn, "reminders_paused", if paused { "true" } else { "false" })
        .map_err(|e| e.to_string())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ScheduleEntry {
    time: String,        // HH:MM
    amount_ml: i64,
    sips: i64,
    status: String,      // 'confirmed' | 'missed' | 'next' | 'upcoming'
    reminder_id: Option<i64>,
    is_override: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ScheduleData {
    past: Vec<ScheduleEntry>,
    next: Option<ScheduleEntry>,
    upcoming: Vec<ScheduleEntry>,
    work_start: String,
    work_end: String,
    interval_min: i64,
    sip_ml: i64,
    has_override: bool,
    override_at: String,
    override_ml: i64,
}

#[tauri::command]
fn get_reminder_schedule(state: State<AppState>) -> Result<ScheduleData, String> {
    let conn = state.conn.lock().unwrap();
    let settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    let date = Local::now().format("%Y-%m-%d").to_string();
    let rows = db::list_today_reminders(&conn, &date).map_err(|e| e.to_string())?;
    let consumed = db::get_today_consumed(&conn, &date).map_err(|e| e.to_string())?;
    drop(conn);

    // Static (formula-based) values for past entries: keep what was
    // suggested at the time they fired.
    let static_ml = hydration::suggested_per_reminder(
        settings.daily_goal_ml, settings.reminder_interval_min,
        &settings.work_start_hour, &settings.work_end_hour, settings.sip_ml,
    );
    let static_sips = hydration::sips_per_reminder(
        settings.daily_goal_ml, settings.reminder_interval_min,
        &settings.work_start_hour, &settings.work_end_hour, settings.sip_ml,
    );

    let mut past = Vec::new();
    for r in &rows {
        let time = r.sent_at.get(11..16).unwrap_or("").to_string();
        past.push(ScheduleEntry {
            time,
            amount_ml: static_ml,
            sips: static_sips,
            status: if r.confirmed { "confirmed".into() } else { "missed".into() },
            reminder_id: Some(r.id),
            is_override: false,
        });
    }

    let now = Local::now();
    let end_time = chrono::NaiveTime::parse_from_str(&settings.work_end_hour, "%H:%M")
        .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(18, 0, 0).unwrap());
    let start_time = chrono::NaiveTime::parse_from_str(&settings.work_start_hour, "%H:%M")
        .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(8, 0, 0).unwrap());

    let last_fire = rows.last().and_then(|r| chrono::NaiveDateTime::parse_from_str(&r.sent_at, "%Y-%m-%dT%H:%M:%S").ok());
    let now_naive = now.naive_local();
    let mut base_next = match last_fire {
        Some(t) => t + chrono::Duration::minutes(settings.reminder_interval_min),
        None => {
            let today_start = now.date_naive().and_time(start_time);
            if now_naive < today_start { today_start } else { now_naive + chrono::Duration::minutes(settings.reminder_interval_min) }
        }
    };
    while base_next <= now_naive {
        base_next = base_next + chrono::Duration::minutes(settings.reminder_interval_min);
    }

    let mut has_override = false;
    let next_at = if !settings.next_override_at.is_empty() {
        if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(&settings.next_override_at, "%Y-%m-%dT%H:%M:%S") {
            if dt > now.naive_local() { has_override = true; dt } else { base_next }
        } else { base_next }
    } else { base_next };

    let today_end = now.date_naive().and_time(end_time);

    // Collect upcoming times after next
    let mut upcoming_times: Vec<chrono::NaiveDateTime> = Vec::new();
    if next_at <= today_end {
        let mut t = next_at + chrono::Duration::minutes(settings.reminder_interval_min);
        while t <= today_end {
            upcoming_times.push(t);
            t = t + chrono::Duration::minutes(settings.reminder_interval_min);
        }
    }

    // Dynamic recalc: distribute remaining ml-to-meta across all remaining slots.
    let next_exists = next_at <= today_end;
    let total_remaining_slots = (if next_exists { 1 } else { 0 }) as i64 + upcoming_times.len() as i64;
    let dyn_sips = hydration::sips_per_remaining_slot(
        settings.daily_goal_ml, consumed, settings.sip_ml, total_remaining_slots,
    );
    let dyn_ml = dyn_sips * settings.sip_ml.max(1);

    // Override forces its own ml on the next slot; upcoming use dyn.
    let next_entry = if next_exists {
        let (amount_ml, sips) = if has_override && settings.next_override_ml > 0 {
            let m = settings.next_override_ml;
            let s = ((m as f64) / settings.sip_ml as f64).ceil() as i64;
            (m, s)
        } else {
            (dyn_ml, dyn_sips)
        };
        Some(ScheduleEntry {
            time: next_at.format("%H:%M").to_string(),
            amount_ml,
            sips,
            status: "next".into(),
            reminder_id: None,
            is_override: has_override,
        })
    } else { None };

    let upcoming: Vec<ScheduleEntry> = upcoming_times.iter().map(|t| ScheduleEntry {
        time: t.format("%H:%M").to_string(),
        amount_ml: dyn_ml,
        sips: dyn_sips,
        status: "upcoming".into(),
        reminder_id: None,
        is_override: false,
    }).collect();

    Ok(ScheduleData {
        past,
        next: next_entry,
        upcoming,
        work_start: settings.work_start_hour,
        work_end: settings.work_end_hour,
        interval_min: settings.reminder_interval_min,
        sip_ml: settings.sip_ml,
        has_override,
        override_at: settings.next_override_at,
        override_ml: settings.next_override_ml,
    })
}

#[tauri::command]
fn set_next_reminder_override(
    state: State<AppState>,
    app: AppHandle,
    at: String,
    amount_ml: i64,
) -> Result<(), String> {
    {
        let conn = state.conn.lock().unwrap();
        db::set_setting(&conn, "next_override_at", &at).map_err(|e| e.to_string())?;
        db::set_setting(&conn, "next_override_ml", &amount_ml.to_string()).map_err(|e| e.to_string())?;
    }
    emit_schedule_changed(&app);
    Ok(())
}

#[tauri::command]
fn clear_next_reminder_override(state: State<AppState>, app: AppHandle) -> Result<(), String> {
    {
        let conn = state.conn.lock().unwrap();
        db::set_setting(&conn, "next_override_at", "").map_err(|e| e.to_string())?;
        db::set_setting(&conn, "next_override_ml", "0").map_err(|e| e.to_string())?;
    }
    emit_schedule_changed(&app);
    Ok(())
}

#[tauri::command]
fn get_last_reminder_id(state: State<AppState>) -> Option<i64> {
    *state.last_reminder_id.lock().unwrap()
}

// --- NEW COMMANDS FOR UPDATE PROMPT & PHRASES ---

#[tauri::command]
fn update_last_check_date(state: State<AppState>) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let today = Local::now().format("%Y-%m-%d").to_string();
    db::set_setting(&conn, "last_data_check_date", &today).map_err(|e| e.to_string())
}

#[tauri::command]
fn install_silent_update(url: String) -> Result<(), String> {
    let script = format!(
        r#"$url = '{}'; $ext = if ($url -like '*msi*') {{ 'msi' }} else {{ 'exe' }}; $dest = "$env:TEMP\gole_installer.$ext"; Remove-Item $dest -ErrorAction SilentlyContinue; Invoke-WebRequest -Uri $url -OutFile $dest; if ($ext -eq 'msi') {{ Start-Process msiexec.exe -ArgumentList '/i', $dest, '/qn', '/norestart' -NoNewWindow }} else {{ Start-Process $dest -ArgumentList '/S' -NoNewWindow }}"#,
        url
    );
    let mut cmd = std::process::Command::new("powershell");
    cmd.args(&["-NoProfile", "-WindowStyle", "Hidden", "-Command", &script]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_all_phrases(state: State<AppState>) -> Result<Vec<PhraseInfo>, String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, text, category, favorite, is_custom FROM phrases ORDER BY id ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(PhraseInfo {
            id: row.get(0)?,
            text: row.get(1)?,
            category: row.get(2)?,
            favorite: row.get::<_, i64>(3)? != 0,
            is_custom: row.get::<_, i64>(4)? != 0,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
fn toggle_favorite_phrase(state: State<AppState>, id: i64, favorite: bool) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "UPDATE phrases SET favorite = ?1 WHERE id = ?2",
        rusqlite::params![if favorite { 1 } else { 0 }, id]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_custom_phrase(state: State<AppState>, text: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "INSERT OR IGNORE INTO phrases (text, category, is_custom) VALUES (?1, 'personalizadas', 1)",
        rusqlite::params![text]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn update_custom_phrase(state: State<AppState>, id: i64, text: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "UPDATE phrases SET text = ?1 WHERE id = ?2 AND is_custom = 1",
        rusqlite::params![text, id]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_custom_phrase(state: State<AppState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "DELETE FROM phrases WHERE id = ?1 AND is_custom = 1",
        rusqlite::params![id]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn pick_phrase(conn: &rusqlite::Connection, personality: &str) -> String {
    let cond = match personality {
        "profissional" => "category = 'profissional'",
        "equilibrado" => "category = 'equilibrado'",
        "brincalhao" => "category = 'brincalhao'",
        "personalizadas" => "is_custom = 1",
        "favoritas" => "favorite = 1",
        "tudo" => "1=1",
        _ => "1=1",
    };

    let get_undisplayed = |c: &rusqlite::Connection| -> Result<Vec<(i64, String)>, rusqlite::Error> {
        let mut stmt = c.prepare(&format!(
            "SELECT id, text FROM phrases WHERE {} AND displayed = 0",
            cond
        ))?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
        })?;
        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    };

    let mut pool = get_undisplayed(conn).unwrap_or_default();
    if pool.is_empty() {
        let _ = conn.execute(&format!(
            "UPDATE phrases SET displayed = 0 WHERE {}",
            cond
        ), []);
        pool = get_undisplayed(conn).unwrap_or_default();
    }

    if pool.is_empty() {
        return "Hora de beber água!".to_string();
    }

    use rand::seq::SliceRandom;
    let mut rng = rand::thread_rng();
    if let Some((id, text)) = pool.choose(&mut rng) {
        let _ = conn.execute("UPDATE phrases SET displayed = 1 WHERE id = ?1", rusqlite::params![id]);
        text.trim_start_matches('💧').trim().to_string()
    } else {
        "Hora de beber água!".to_string()
    }
}

fn trigger_queued_reminder(app: &AppHandle, reminder: Reminder) {
    let payload = serde_json::json!({
        "id": reminder.id,
        "phrase": reminder.phrase,
        "suggested_ml": reminder.suggested_ml,
        "consumed_ml": reminder.consumed_ml,
        "remaining_ml": reminder.remaining_ml,
        "container_text": reminder.container_text,
        "suggested_sips": reminder.suggested_sips,
        "sip_ml": reminder.sip_ml,
        "is_test": reminder.is_test,
        "app_mode": reminder.app_mode,
        "snooze_count": reminder.snooze_count,
    });

    // Also emit to main window so the in-app sound plays
    let _ = app.emit("reminder", &payload);
    emit_schedule_changed(app);

    // Show the custom-styled reminder window (replaces native OS notification)
    if let Some(window) = app.get_webview_window("reminder") {
        // Reposition before showing in case primary monitor changed
        position_reminder_window(&window);
        let _ = window.show();
        // Re-assert always-on-top each time. Some shells / focus stealers
        // can reset this between show cycles.
        let _ = window.set_always_on_top(true);
        // Emit again specifically to ensure window has the payload (it's already listening globally)
        let _ = window.emit("reminder", &payload);
    }
}

#[tauri::command]
fn send_reminder(state: State<AppState>, app: AppHandle, force: Option<bool>) -> Result<(), String> {
    let settings;
    let suggested;
    let consumed;
    let phrase;
    let is_forced = force.unwrap_or(false);
    {
        let conn = state.conn.lock().unwrap();
        settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
        if !is_forced && settings.reminders_paused { return Ok(()); }

        // Valida se o horário atual do PC está dentro do período ativo de trabalho do usuário
        let now_time = Local::now().time();
        let start_time = chrono::NaiveTime::parse_from_str(&settings.work_start_hour, "%H:%M")
            .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(8, 0, 0).unwrap());
        let end_time = chrono::NaiveTime::parse_from_str(&settings.work_end_hour, "%H:%M")
            .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(18, 0, 0).unwrap());
            
        if !is_forced && (now_time < start_time || now_time > end_time) {
            return Ok(());
        }

        let date = Local::now().format("%Y-%m-%d").to_string();
        consumed = db::get_today_consumed(&conn, &date).map_err(|e| e.to_string())?;

        suggested = current_suggested_amount(&conn);

        // Consume override now that it has fired
        if !settings.next_override_at.is_empty() || settings.next_override_ml > 0 {
            let _ = db::set_setting(&conn, "next_override_at", "");
            let _ = db::set_setting(&conn, "next_override_ml", "0");
        }
        // In test mode (forced send), pick the longest phrase to expose
        // worst-case layout in the dev preview.
        phrase = if is_forced {
            conn.query_row(
                "SELECT text FROM phrases ORDER BY LENGTH(text) DESC LIMIT 1",
                [],
                |row| row.get::<_, String>(0),
            )
            .ok()
            .map(|t| t.trim_start_matches('💧').trim().to_string())
            .unwrap_or_else(|| pick_phrase(&conn, &settings.notification_personality))
        } else {
            pick_phrase(&conn, &settings.notification_personality)
        };
    }

    let now = Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let reminder_id = {
        let conn = state.conn.lock().unwrap();
        db::log_reminder(&conn, &now).map_err(|e| e.to_string())?
    };

    {
        let mut last_id = state.last_reminder_id.lock().unwrap();
        *last_id = Some(reminder_id);
    }

    let remaining = (settings.daily_goal_ml - consumed).max(0);

    let suggested_sips = ((suggested as f64) / (settings.sip_ml.max(1)) as f64).ceil() as i64;
    let container_text = if suggested_sips == 1 {
        format!("1 gole de {}ml", settings.sip_ml)
    } else {
        format!("{} goles de {}ml", suggested_sips, settings.sip_ml)
    };

    let snooze_count = *state.snooze_count.lock().unwrap();

    let reminder = Reminder {
        id: reminder_id,
        phrase,
        suggested_ml: suggested,
        consumed_ml: consumed,
        remaining_ml: remaining,
        container_text,
        suggested_sips,
        sip_ml: settings.sip_ml,
        is_test: is_forced,
        app_mode: settings.app_mode,
        snooze_count,
    };

    if is_fullscreen(&app) {
        if let Some(queue) = app.try_state::<Arc<Mutex<Vec<Reminder>>>>() {
            let mut q = queue.lock().unwrap();
            q.push(reminder);
        }
    } else {
        trigger_queued_reminder(&app, reminder);
    }

    Ok(())
}

#[tauri::command]
fn export_history_csv(state: State<AppState>, filepath: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, date, amount_ml, logged_at FROM daily_logs ORDER BY logged_at ASC")
        .map_err(|e| e.to_string())?;

    let mut csv_content = String::from("id,date,amount_ml,logged_at\n");
    let rows = stmt
        .query_map([], |row| {
            let id: i64 = row.get(0)?;
            let date: String = row.get(1)?;
            let amount_ml: i64 = row.get(2)?;
            let logged_at: String = row.get(3)?;
            Ok((id, date, amount_ml, logged_at))
        })
        .map_err(|e| e.to_string())?;

    for row in rows {
        let (id, date, amount_ml, logged_at) = row.map_err(|e| e.to_string())?;
        csv_content.push_str(&format!("{},{},{},{}\n", id, date, amount_ml, logged_at));
    }

    std::fs::write(&filepath, csv_content).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(serde::Deserialize)]
struct WaterPayload {
    ml: i64,
}

async fn add_water_handler(
    axum::extract::State(app_handle): axum::extract::State<tauri::AppHandle>,
    axum::Json(payload): axum::Json<WaterPayload>,
) -> impl axum::response::IntoResponse {
    use tauri::{Manager, Emitter};
    use axum::response::IntoResponse;
    
    if payload.ml <= 0 {
        return (axum::http::StatusCode::BAD_REQUEST, "Quantidade de água inválida").into_response();
    }

    let state = match app_handle.try_state::<AppState>() {
        Some(s) => s,
        None => return (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Estado do aplicativo não encontrado").into_response(),
    };

    let now = chrono::Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();

    let result = {
        let conn = state.conn.lock().unwrap();
        db::log_drink(&conn, &date, payload.ml, &logged_at).map(|_| {
            try_consume_next_slot(&conn, &now.naive_local());
        })
    };

    match result {
        Ok(_) => {
            if let Ok(mut count) = state.snooze_count.lock() {
                *count = 0;
            }
            if let Err(e) = check_achievements_internal(&state) {
                eprintln!("Erro ao verificar conquistas: {:?}", e);
            }

            let _ = app_handle.emit("quick-drink", payload.ml);
            let _ = app_handle.emit("schedule_changed", ());
            let _ = app_handle.emit("refresh_data", ());

            (axum::http::StatusCode::OK, "Log de água inserido com sucesso").into_response()
        }
        Err(e) => {
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, format!("Erro ao gravar no banco: {}", e)).into_response()
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| {
                use tauri_plugin_global_shortcut::{Modifiers, Code, ShortcutState};
                if event.state() == ShortcutState::Pressed {
                    if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyW) {
                        if let Some(state) = app.try_state::<AppState>() {
                            let now = Local::now();
                            let date = now.format("%Y-%m-%d").to_string();
                            let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();
                            let amt = {
                                let conn = state.conn.lock().unwrap();
                                let settings = match db::get_settings(&conn) {
                                    Ok(s) => s,
                                    Err(_) => return,
                                };
                                let amt = if settings.recipiente_configurado {
                                    settings.recipiente_capacidade_ml
                                } else {
                                    current_suggested_amount(&conn)
                                };
                                let _ = db::log_drink(&conn, &date, amt, &logged_at);
                                try_consume_next_slot(&conn, &now.naive_local());
                                amt
                            };

                            {
                                if let Ok(mut count) = state.snooze_count.lock() {
                                    *count = 0;
                                }
                            }

                            let _ = app.emit("quick-drink", amt);
                            let _ = app.emit("schedule_changed", ());
                            let _ = app.emit("refresh_data", ());
                        }
                    }
                }
            })
            .build()
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            
            // Migração de banco de dados e arquivos de configuração (se necessário)
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                let db_path = db::get_db_path(&app_data_dir);
                if !db_path.exists() {
                    if let Some(parent) = app_data_dir.parent() {
                        let old_dirs = [
                            parent.join("com.gole.app"),
                            parent.join("GOLE"),
                        ];
                        for old_dir in &old_dirs {
                            let old_db = old_dir.join("gole.db");
                            if old_db.exists() {
                                std::fs::create_dir_all(&app_data_dir).ok();
                                if std::fs::copy(&old_db, &db_path).is_ok() {
                                    break;
                                }
                            }
                        }
                    }
                }

                // Limpa chave de inicialização antiga 'GOLE' silenciosamente para evitar duplicatas
                let _ = std::process::Command::new("powershell")
                    .args(&[
                        "-NoProfile",
                        "-WindowStyle",
                        "Hidden",
                        "-Command",
                        "Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'GOLE' -ErrorAction SilentlyContinue"
                    ])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .spawn();
            }

            std::fs::create_dir_all(&app_data_dir).ok();
            let db_path = db::get_db_path(&app_data_dir);
            let conn = Connection::open(&db_path).expect("failed to open db");
            db::init_db(&conn).expect("failed to init db");

            app.manage(AppState {
                conn: Mutex::new(conn),
                last_reminder_id: Mutex::new(None),
                tray_drink_item: Mutex::new(None),
                snooze_count: Mutex::new(0),
            });

            let queue: Arc<Mutex<Vec<Reminder>>> = Arc::new(Mutex::new(Vec::new()));
            app.manage(queue.clone());

            let app_handle = app.handle().clone();

            let app_handle_axum = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let router = axum::Router::new()
                    .route("/api/water", axum::routing::post(add_water_handler))
                    .with_state(app_handle_axum);

                let listener = match tokio::net::TcpListener::bind("127.0.0.1:4000").await {
                    Ok(l) => l,
                    Err(e) => {
                        eprintln!("Falha ao iniciar listener do Axum na porta 4000: {:?}", e);
                        return;
                    }
                };

                if let Err(e) = axum::serve(listener, router).await {
                    eprintln!("Erro no servidor Axum: {:?}", e);
                }
            });

            let app_handle_weather = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                run_weather_worker(app_handle_weather).await;
            });

            let app_handle_missions = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                run_missions_worker(app_handle_missions).await;
            });

            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
                loop {
                    interval.tick().await;

                    if let Some(q_state) = app_handle.try_state::<Arc<Mutex<Vec<Reminder>>>>() {
                        let has_items = {
                            let q = q_state.lock().unwrap();
                            !q.is_empty()
                        };

                        if has_items {
                            if !is_fullscreen(&app_handle) {
                                let next_reminder = {
                                    let mut q = q_state.lock().unwrap();
                                    if !q.is_empty() {
                                        Some(q.remove(0))
                                    } else {
                                        None
                                    }
                                };

                                if let Some(reminder) = next_reminder {
                                    trigger_queued_reminder(&app_handle, reminder);
                                }
                            }
                        }
                    }
                }
            });

            // Sincroniza estado de autostart com o sistema operacional
            let is_autostart_enabled = {
                let state: State<AppState> = app.state();
                let conn = state.conn.lock().unwrap();
                db::get_settings(&conn).map(|s| s.autostart).unwrap_or(false)
            };
            if is_autostart_enabled {
                use tauri_plugin_autostart::ManagerExt;
                let autostart_manager = app.autolaunch();
                let _ = autostart_manager.enable();
            }

            // O aplicativo sempre inicia em segundo plano (oculto na bandeja do sistema).
            // A janela principal só será exibida se o usuário solicitar através do ícone da bandeja.

            let initial_paused = {
                let state: State<AppState> = app.state();
                let conn = state.conn.lock().unwrap();
                db::get_settings(&conn).map(|s| s.reminders_paused).unwrap_or(false)
            };
            let pause_label = if initial_paused { "▶ Retomar lembretes" } else { "⏸ Pausar lembretes" };

            let (initial_drink_amount, is_basic) = {
                let state: State<AppState> = app.state();
                let conn = state.conn.lock().unwrap();
                let amount = current_suggested_amount(&conn);
                let is_basic = db::get_settings(&conn)
                    .map(|s| s.app_mode == "basic")
                    .unwrap_or(false);
                (amount, is_basic)
            };

            let drink_item_text = if is_basic {
                "💧 Beber água agora".to_string()
            } else {
                drink_label(initial_drink_amount)
            };

            let item_open = MenuItem::with_id(app, "dashboard", "Abrir Gole", true, None::<&str>)?;
            let item_drink = MenuItem::with_id(app, "drink", drink_item_text, true, None::<&str>)?;
            let item_pause_toggle = MenuItem::with_id(app, "pause_toggle", pause_label, true, None::<&str>)?;
            let item_quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;

            let sep1 = PredefinedMenuItem::separator(app)?;
            let sep2 = PredefinedMenuItem::separator(app)?;

            let menu = Menu::with_items(
                app,
                &[
                    &item_open,
                    &sep1,
                    &item_drink,
                    &item_pause_toggle,
                    &sep2,
                    &item_quit,
                ],
            )?;

            let pause_handle = item_pause_toggle.clone();

            // Save the drink item handle so we can update its label on settings change
            {
                let state: State<AppState> = app.state();
                *state.tray_drink_item.lock().unwrap() = Some(item_drink.clone());
            }

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "dashboard" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = app.emit("navigate", "/dashboard");
                        }
                    }
                    "drink" => {
                        if let Some(state) = app.try_state::<AppState>() {
                            let now = Local::now();
                            let date = now.format("%Y-%m-%d").to_string();
                            let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();
                            let amount = {
                                let conn = state.conn.lock().unwrap();
                                let amt = current_suggested_amount(&conn);
                                let _ = db::log_drink(&conn, &date, amt, &logged_at);
                                try_consume_next_slot(&conn, &now.naive_local());
                                amt
                            };
                            let _ = app.emit("quick-drink", amount);
                            let _ = app.emit("schedule_changed", ());
                        }
                    }
                    "pause_toggle" => {
                        if let Some(state) = app.try_state::<AppState>() {
                            let new_paused = {
                                let conn = state.conn.lock().unwrap();
                                let current = db::get_settings(&conn).map(|s| s.reminders_paused).unwrap_or(false);
                                let new_paused = !current;
                                let _ = db::set_setting(&conn, "reminders_paused", if new_paused { "true" } else { "false" });
                                new_paused
                            };
                            let new_label = if new_paused { "▶ Retomar lembretes" } else { "⏸ Pausar lembretes" };
                            let _ = pause_handle.set_text(new_label);
                            let _ = app.emit("reminders_paused", new_paused);
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button, button_state, .. } = event {
                        if button == MouseButton::Left && button_state == MouseButtonState::Up {
                            if let Some(window) = tray.app_handle().get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = tray.app_handle().emit("navigate", "/dashboard");
                            }
                        }
                    }
                })
                .build(app)?;

            // --- Custom reminder window (frameless, transparent, always-on-top) ---
            let reminder_window = WebviewWindowBuilder::new(
                app,
                "reminder",
                WebviewUrl::App("index.html?window=reminder".into()),
            )
            .title("Gole Lembrete")
            .inner_size(360.0, 200.0)
            .min_inner_size(360.0, 200.0)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .visible(false)
            .shadow(false)
            .focused(false)
            .build()?;

            position_reminder_window(&reminder_window);

            // Pre-hide gracefully when user clicks the window's [X]-equivalent close
            let reminder_clone = reminder_window.clone();
            reminder_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let _ = reminder_clone.hide();
                    api.prevent_close();
                }
            });

            // Registra o atalho global Ctrl+Shift+W
            use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
            let shortcut = Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::KeyW,
            );
            if let Err(e) = app.global_shortcut().register(shortcut) {
                eprintln!("Erro ao registrar atalho global Ctrl+Shift+W: {:?}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            complete_onboarding,
            get_today_stats,
            log_drink,
            confirm_reminder,
            get_week_stats,
            get_month_stats,
            get_achievements_list,
            calculate_goal_cmd,
            set_reminders_paused,
            send_reminder,
            get_last_reminder_id,
            update_last_check_date,
            get_all_phrases,
            toggle_favorite_phrase,
            create_custom_phrase,
            update_custom_phrase,
            delete_custom_phrase,
            delete_last_drink,
            get_today_drinks,
            update_drink,
            delete_drink,
            get_range_stats,
            get_drinks_for_date,
            log_drink_at,
            install_silent_update,
            get_reminder_schedule,
            set_next_reminder_override,
            clear_next_reminder_override,
            snooze_reminder,
            get_daily_success_rate,
            get_today_reminders_list,
            toggle_reminder_status,
            delete_reminder,
            add_custom_reminder,
            dev_gate::verify_dev_password,
            dev_gate::compute_dev_password_hash,
            dev_gate::dev_gate_available,
            set_today_total,
            export_history_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// --- OpenWeather API Integration Structs ---

#[derive(Deserialize, Debug, Clone)]
struct ForecastResponse {
    list: Vec<ForecastItem>,
}

#[derive(Deserialize, Debug, Clone)]
struct ForecastItem {
    main: ForecastMain,
    weather: Vec<ForecastWeather>,
}

#[derive(Deserialize, Debug, Clone)]
struct ForecastMain {
    temp: f64,
}

#[derive(Deserialize, Debug, Clone)]
struct ForecastWeather {
    main: String,
    description: String,
    icon: String,
}

// --- Background Workers (Clima e Missões) ---

async fn run_weather_worker(app: tauri::AppHandle) {
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(60 * 60));
    loop {
        interval.tick().await;
        
        let state = match app.try_state::<AppState>() {
            Some(s) => s,
            None => continue,
        };
        
        let (enabled, city, key) = {
            let conn = state.conn.lock().unwrap();
            match db::get_settings(&conn) {
                Ok(s) => (s.weather_enabled, s.weather_city, s.weather_api_key),
                Err(_) => (false, String::new(), String::new()),
            }
        };
        
        if !enabled {
            continue;
        }
        
        let date = Local::now().format("%Y-%m-%d").to_string();
        let mut heat_anomaly = false;
        
        if key.is_empty() && city.to_lowercase() == "sinop" {
            heat_anomaly = true;
            println!("[Weather Worker Mock] Simulando calor excessivo (36°C) para Sinop.");
            let conn = state.conn.lock().unwrap();
            let _ = db::set_setting(&conn, "weather_current_temp", "36.0");
            let _ = db::set_setting(&conn, "weather_current_condition", "Clear");
            let _ = db::set_setting(&conn, "weather_current_description", "calor excessivo");
            let _ = db::set_setting(&conn, "weather_current_icon", "01d");
            let _ = db::set_setting(&conn, "weather_last_updated", &Local::now().format("%H:%M").to_string());
            let _ = app.emit("weather_updated", ());
        } else if !key.is_empty() {
            let url = format!(
                "https://api.openweathermap.org/data/2.5/forecast?q={}&appid={}&units=metric&cnt=8",
                city, key
            );
            match reqwest::get(&url).await {
                Ok(res) => {
                    if res.status().is_success() {
                        if let Ok(forecast) = res.json::<ForecastResponse>().await {
                            // Extrair o clima atual do primeiro item do forecast
                            if let Some(current_item) = forecast.list.first() {
                                let current_temp = current_item.main.temp;
                                let current_cond = current_item.weather.first().map(|w| w.main.clone()).unwrap_or_else(|| "Clear".to_string());
                                let current_desc = current_item.weather.first().map(|w| w.description.clone()).unwrap_or_else(|| "clear sky".to_string());
                                let current_icon = current_item.weather.first().map(|w| w.icon.clone()).unwrap_or_else(|| "01d".to_string());
                                
                                let conn = state.conn.lock().unwrap();
                                let _ = db::set_setting(&conn, "weather_current_temp", &current_temp.to_string());
                                let _ = db::set_setting(&conn, "weather_current_condition", &current_cond);
                                let _ = db::set_setting(&conn, "weather_current_description", &current_desc);
                                let _ = db::set_setting(&conn, "weather_current_icon", &current_icon);
                                let _ = db::set_setting(&conn, "weather_last_updated", &Local::now().format("%H:%M").to_string());
                                let _ = app.emit("weather_updated", ());
                            }

                            for item in &forecast.list {
                                if item.main.temp >= 35.0 {
                                    heat_anomaly = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Erro ao chamar a API do OpenWeather: {:?}", e);
                }
            }
        }
        
        if heat_anomaly {
            let conn = state.conn.lock().unwrap();
            if let Err(e) = db::add_daily_modifier(&conn, &date, 500, "Calor excessivo") {
                eprintln!("Erro ao adicionar modificador de clima: {:?}", e);
            } else {
                let _ = app.emit("modifiers_updated", ());
                let _ = app.emit("schedule_changed", ());
            }
        }
    }
}

async fn run_missions_worker(app: tauri::AppHandle) {
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(15 * 60));
    loop {
        interval.tick().await;
        
        let state = match app.try_state::<AppState>() {
            Some(s) => s,
            None => continue,
        };
        
        let conn = state.conn.lock().unwrap();
        let date = Local::now().format("%Y-%m-%d").to_string();
        
        if let Ok(Some(_)) = db::get_daily_mission(&conn, &date) {
            continue;
        }
        
        let logs_result = conn.prepare(
            "SELECT logged_at, amount_ml FROM daily_logs WHERE date >= date('now', '-3 days') AND date < date('now')"
        );
        
        if let Ok(mut stmt) = logs_result {
            let logs_rows = stmt.query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
            });
            
            if let Ok(rows) = logs_rows {
                let mut morning_totals = std::collections::HashMap::new();
                let mut days_tracked = std::collections::HashSet::new();
                
                for r in rows {
                    if let Ok((logged_at, amount_ml)) = r {
                        if let Some(date_part) = logged_at.split('T').next() {
                            let day = date_part.to_string();
                            days_tracked.insert(day.clone());
                            
                            if let Some(time_part) = logged_at.split('T').nth(1) {
                                if let Some(hour_str) = time_part.split(':').next() {
                                    if let Ok(hour) = hour_str.parse::<u32>() {
                                        if hour < 12 {
                                            let current = morning_totals.entry(day).or_insert(0i64);
                                            *current += amount_ml;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                let mut morning_failure = false;
                if !days_tracked.is_empty() {
                    let mut all_failed = true;
                    for d in &days_tracked {
                        let morning_consumed = morning_totals.get(d).cloned().unwrap_or(0);
                        if morning_consumed >= 300 {
                            all_failed = false;
                            break;
                        }
                    }
                    morning_failure = all_failed;
                }
                
                let (description, target, m_type) = if morning_failure {
                    ("Despertar Hidratado: Beba 500ml antes das 10h", 500, "morning_hydration")
                } else {
                    ("Meta de Foco: Beba 600ml de água para iniciar bem", 600, "regular_hydration")
                };
                
                if let Err(e) = db::create_daily_mission(&conn, &date, description, target, m_type) {
                    eprintln!("Erro ao criar missão diária: {:?}", e);
                } else {
                    let _ = app.emit("mission_updated", ());
                }
            }
        }
    }
}
