mod db;
mod hydration;

use std::sync::Mutex;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State, AppHandle, Emitter, WindowEvent, WebviewUrl, WebviewWindowBuilder, PhysicalPosition};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use chrono::Local;

struct AppState {
    conn: Mutex<Connection>,
    last_reminder_id: Mutex<Option<i64>>,
    tray_drink_item: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
}

fn drink_label(amount: i64) -> String {
    format!("💧 Beber água agora (+{}ml)", amount)
}

fn position_reminder_window(window: &tauri::WebviewWindow) {
    // Place at bottom-right of the current monitor with a margin.
    if let Ok(Some(monitor)) = window.current_monitor() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let win_w = (400.0 * scale) as i32;
        let win_h = (220.0 * scale) as i32;
        let margin = (24.0 * scale) as i32;
        // Push up a bit to clear the Windows taskbar (~40px)
        let taskbar_gap = (48.0 * scale) as i32;
        let x = (size.width as i32 - win_w - margin).max(0);
        let y = (size.height as i32 - win_h - margin - taskbar_gap).max(0);
        let _ = window.set_position(PhysicalPosition::new(x, y));
    }
}

fn current_suggested_amount(conn: &Connection) -> i64 {
    db::get_settings(conn)
        .ok()
        .map(|s| hydration::suggested_per_reminder(s.daily_goal_ml, s.reminder_interval_min, &s.work_start_hour, &s.work_end_hour))
        .unwrap_or(250)
}

fn refresh_tray_drink_label(app: &AppHandle) {
    if let Some(state) = app.try_state::<AppState>() {
        let amount = {
            let conn = state.conn.lock().unwrap();
            current_suggested_amount(&conn)
        };
        if let Some(item) = state.tray_drink_item.lock().unwrap().as_ref() {
            let _ = item.set_text(drink_label(amount));
        }
    }
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
) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let base_goal = hydration::calculate_goal(weight_kg, &activity_level, &climate);
    let wake_hours = 16.0f64;
    let reminders_per_day = (wake_hours * 60.0 / reminder_interval_min as f64).floor() as i64;
    let goal = if reminders_per_day > 0 {
        let suggested = (base_goal as f64 / reminders_per_day as f64).round() as i64;
        suggested * reminders_per_day
    } else {
        base_goal
    };
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
fn log_drink_at(state: State<AppState>, amount_ml: i64, logged_at: String) -> Result<TodayStats, String> {
    let date = logged_at.get(0..10).unwrap_or("").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::log_drink(&conn, &date, amount_ml, &logged_at).map_err(|e| e.to_string())?;
    }
    check_achievements_internal(&state)?;
    get_today_stats(state)
}

#[tauri::command]
fn update_drink(state: State<AppState>, id: i64, amount_ml: i64, logged_at: String) -> Result<TodayStats, String> {
    {
        let conn = state.conn.lock().unwrap();
        db::update_drink(&conn, id, amount_ml, &logged_at).map_err(|e| e.to_string())?;
    }
    get_today_stats(state)
}

#[tauri::command]
fn delete_drink(state: State<AppState>, id: i64) -> Result<TodayStats, String> {
    {
        let conn = state.conn.lock().unwrap();
        db::delete_drink(&conn, id).map_err(|e| e.to_string())?;
    }
    get_today_stats(state)
}

#[tauri::command]
fn delete_last_drink(state: State<AppState>) -> Result<TodayStats, String> {
    let date = Local::now().format("%Y-%m-%d").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::delete_last_drink(&conn, &date).map_err(|e| e.to_string())?;
    }
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
) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let base_goal = hydration::calculate_goal(weight_kg, &activity_level, &climate);
    let interval = 60; // default interval is 60 minutes
    let reminders_per_day = (16.0 * 60.0 / interval as f64).floor() as i64;
    let goal = if reminders_per_day > 0 {
        let suggested = (base_goal as f64 / reminders_per_day as f64).round() as i64;
        suggested * reminders_per_day
    } else {
        base_goal
    };

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
    let goal = settings.daily_goal_ml;
    let remaining = (goal - consumed).max(0);
    let percent = if goal > 0 { consumed as f64 / goal as f64 * 100.0 } else { 0.0 };
    let streak = db::get_streak(&conn, goal).map_err(|e| e.to_string())?;
    let (sent, confirmed) = db::get_today_reminders(&conn, &date).map_err(|e| e.to_string())?;
    let suggested = hydration::suggested_per_reminder(goal, settings.reminder_interval_min, &settings.work_start_hour, &settings.work_end_hour);
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
    })
}

#[tauri::command]
fn log_drink(state: State<AppState>, amount_ml: i64) -> Result<TodayStats, String> {
    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::log_drink(&conn, &date, amount_ml, &logged_at).map_err(|e| e.to_string())?;
    }
    check_achievements_internal(&state)?;
    get_today_stats(state)
}

#[tauri::command]
fn confirm_reminder(state: State<AppState>, reminder_id: i64, amount_ml: i64) -> Result<TodayStats, String> {
    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let logged_at = now.format("%Y-%m-%dT%H:%M:%S").to_string();
    {
        let conn = state.conn.lock().unwrap();
        db::confirm_reminder(&conn, reminder_id).map_err(|e| e.to_string())?;
        db::log_drink(&conn, &date, amount_ml, &logged_at).map_err(|e| e.to_string())?;
    }
    check_achievements_internal(&state)?;
    get_today_stats(state)
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

        suggested = hydration::suggested_per_reminder(settings.daily_goal_ml, settings.reminder_interval_min, &settings.work_start_hour, &settings.work_end_hour);
        let date = Local::now().format("%Y-%m-%d").to_string();
        consumed = db::get_today_consumed(&conn, &date).map_err(|e| e.to_string())?;
        phrase = pick_phrase(&conn, &settings.notification_personality);
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

    let container_text = if settings.recipiente_configurado {
        let container_name = if settings.recipiente_capacidade_ml < 350 {
            "copo"
        } else if settings.recipiente_capacidade_ml >= 1800 {
            "garrafão"
        } else {
            "garrafa"
        };
        let ratio = suggested as f64 / settings.recipiente_capacidade_ml as f64;
        let text = if suggested <= 50 {
            format!("um pequeno gole da sua {}", container_name)
        } else if suggested <= 100 {
            "aprox. 2 dedos de água".to_string()
        } else if (ratio - 0.25).abs() <= 0.05 {
            format!("cerca de 1/4 da sua {}", container_name)
        } else if (ratio - 0.5).abs() <= 0.05 {
            format!("metade da sua {}", container_name)
        } else if (ratio - 0.75).abs() <= 0.05 {
            format!("3/4 da sua {}", container_name)
        } else if (ratio - 1.0).abs() <= 0.08 {
            format!("uma {} inteira", container_name)
        } else {
            let pct = (ratio * 100.0).round() as i64;
            format!("≈ {}% da sua {}", pct, container_name)
        };
        Some(text)
    } else {
        None
    };

    let payload = serde_json::json!({
        "id": reminder_id,
        "phrase": phrase,
        "suggested_ml": suggested,
        "consumed_ml": consumed,
        "remaining_ml": remaining,
        "container_text": container_text,
    });

    // Also emit to main window so the in-app sound plays
    let _ = app.emit("reminder", &payload);

    // Show the custom-styled reminder window (replaces native OS notification)
    if let Some(window) = app.get_webview_window("reminder") {
        // Reposition before showing in case primary monitor changed
        position_reminder_window(&window);
        let _ = window.show();
        // Emit again specifically to ensure window has the payload (it's already listening globally)
        let _ = window.emit("reminder", &payload);
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
            std::fs::create_dir_all(&app_data_dir).ok();
            let db_path = db::get_db_path(&app_data_dir);
            let conn = Connection::open(&db_path).expect("failed to open db");
            db::init_db(&conn).expect("failed to init db");

            app.manage(AppState {
                conn: Mutex::new(conn),
                last_reminder_id: Mutex::new(None),
                tray_drink_item: Mutex::new(None),
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

            // Exibe a janela principal se não iniciar oculto (--hidden)
            let args: Vec<String> = std::env::args().collect();
            let start_hidden = args.contains(&"--hidden".to_string());
            if !start_hidden {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            let initial_paused = {
                let state: State<AppState> = app.state();
                let conn = state.conn.lock().unwrap();
                db::get_settings(&conn).map(|s| s.reminders_paused).unwrap_or(false)
            };
            let pause_label = if initial_paused { "▶ Retomar lembretes" } else { "⏸ Pausar lembretes" };

            let initial_drink_amount = {
                let state: State<AppState> = app.state();
                let conn = state.conn.lock().unwrap();
                current_suggested_amount(&conn)
            };

            let item_open = MenuItem::with_id(app, "dashboard", "Abrir GOLE", true, None::<&str>)?;
            let item_drink = MenuItem::with_id(app, "drink", drink_label(initial_drink_amount), true, None::<&str>)?;
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
                                amt
                            };
                            let _ = app.emit("quick-drink", amount);
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
            .title("GOLE Lembrete")
            .inner_size(400.0, 220.0)
            .min_inner_size(400.0, 220.0)
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
