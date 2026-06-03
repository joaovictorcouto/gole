mod db;
mod hydration;
mod phrases;

use std::sync::Mutex;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State, AppHandle, Emitter};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use chrono::Local;
use std::collections::VecDeque;

struct AppState {
    conn: Mutex<Connection>,
    recent_phrases: Mutex<VecDeque<String>>,
    last_reminder_id: Mutex<Option<i64>>,
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

#[tauri::command]
fn get_settings(state: State<AppState>) -> Result<db::Settings, String> {
    let conn = state.conn.lock().unwrap();
    db::get_settings(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_settings(
    state: State<AppState>,
    weight_kg: f64,
    activity_level: String,
    climate: String,
    reminder_interval_min: i64,
    notification_personality: String,
    smart_mode: bool,
    autostart: bool,
) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let goal = hydration::calculate_goal(weight_kg, &activity_level, &climate);
    db::set_setting(&conn, "weight_kg", &weight_kg.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "activity_level", &activity_level).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "climate", &climate).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "daily_goal_ml", &goal.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "reminder_interval_min", &reminder_interval_min.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "notification_personality", &notification_personality).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "smart_mode", if smart_mode { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "autostart", if autostart { "true" } else { "false" }).map_err(|e| e.to_string())?;
    Ok(goal)
}

#[tauri::command]
fn complete_onboarding(
    state: State<AppState>,
    weight_kg: f64,
    activity_level: String,
    climate: String,
) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let goal = hydration::calculate_goal(weight_kg, &activity_level, &climate);
    db::set_setting(&conn, "weight_kg", &weight_kg.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "activity_level", &activity_level).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "climate", &climate).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "daily_goal_ml", &goal.to_string()).map_err(|e| e.to_string())?;
    db::set_setting(&conn, "onboarding_complete", "true").map_err(|e| e.to_string())?;
    Ok(goal)
}

#[tauri::command]
fn get_today_stats(state: State<AppState>) -> Result<TodayStats, String> {
    let conn = state.conn.lock().unwrap();
    let settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
    let date = Local::now().format("%Y-%m-%d").to_string();
    let consumed = db::get_today_consumed(&conn, &date).map_err(|e| e.to_string())?;
    let goal = settings.daily_goal_ml;
    let remaining = (goal - consumed).max(0);
    let percent = if goal > 0 { consumed as f64 / goal as f64 * 100.0 } else { 0.0 };
    let streak = db::get_streak(&conn, goal).map_err(|e| e.to_string())?;
    let (sent, confirmed) = db::get_today_reminders(&conn, &date).map_err(|e| e.to_string())?;
    let suggested = hydration::suggested_per_reminder(goal, settings.reminder_interval_min);
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
fn get_achievements_list(state: State<AppState>) -> Result<Vec<Achievement>, String> {
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

    if consumed > 0 {
        let _ = db::unlock_achievement(&conn, "first_day", &now);
    }
    if consumed >= settings.daily_goal_ml {
        let _ = db::unlock_achievement(&conn, "goal_complete", &now);
    }
    let streak = db::get_streak(&conn, settings.daily_goal_ml).map_err(|e| e.to_string())?;
    if streak >= 7 { let _ = db::unlock_achievement(&conn, "streak_7", &now); }
    if streak >= 30 { let _ = db::unlock_achievement(&conn, "streak_30", &now); }
    if streak >= 100 { let _ = db::unlock_achievement(&conn, "streak_100", &now); }
    let total_liters = db::get_total_consumed_liters(&conn).map_err(|e| e.to_string())?;
    if total_liters >= 100.0 {
        let _ = db::unlock_achievement(&conn, "liters_100", &now);
    }
    Ok(())
}

#[tauri::command]
fn calculate_goal_cmd(weight_kg: f64, activity_level: String, climate: String) -> i64 {
    hydration::calculate_goal(weight_kg, &activity_level, &climate)
}

#[tauri::command]
fn set_reminders_paused(state: State<AppState>, paused: bool) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    db::set_setting(&conn, "reminders_paused", if paused { "true" } else { "false" })
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn send_reminder(state: State<AppState>, app: AppHandle) -> Result<(), String> {
    let settings;
    let suggested;
    {
        let conn = state.conn.lock().unwrap();
        settings = db::get_settings(&conn).map_err(|e| e.to_string())?;
        if settings.reminders_paused { return Ok(()); }
        suggested = hydration::suggested_per_reminder(settings.daily_goal_ml, settings.reminder_interval_min);
    }

    let phrase = {
        let recent = state.recent_phrases.lock().unwrap();
        let recent_vec: Vec<String> = recent.iter().cloned().collect();
        phrases::pick_phrase(&settings.notification_personality, &recent_vec)
    };

    {
        let mut recent = state.recent_phrases.lock().unwrap();
        recent.push_back(phrase.text.to_string());
        if recent.len() > 5 {
            recent.pop_front();
        }
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

    let _ = app.emit("reminder", serde_json::json!({
        "id": reminder_id,
        "phrase": phrase.text,
        "suggested_ml": suggested,
    }));

    Ok(())
}

#[tauri::command]
fn get_last_reminder_id(state: State<AppState>) -> Option<i64> {
    *state.last_reminder_id.lock().unwrap()
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
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).ok();
            let db_path = db::get_db_path(&app_data_dir);
            let conn = Connection::open(&db_path).expect("failed to open db");
            db::init_db(&conn).expect("failed to init db");

            app.manage(AppState {
                conn: Mutex::new(conn),
                recent_phrases: Mutex::new(VecDeque::new()),
                last_reminder_id: Mutex::new(None),
            });

            let show = MenuItem::with_id(app, "show", "Abrir GOLE", true, None::<&str>)?;
            let pause = MenuItem::with_id(app, "pause", "Pausar lembretes", true, None::<&str>)?;
            let resume = MenuItem::with_id(app, "resume", "Retomar lembretes", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &pause, &resume, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "pause" => {
                        if let Some(state) = app.try_state::<AppState>() {
                            let conn = state.conn.lock().unwrap();
                            let _ = db::set_setting(&conn, "reminders_paused", "true");
                            let _ = app.emit("reminders_paused", true);
                        }
                    }
                    "resume" => {
                        if let Some(state) = app.try_state::<AppState>() {
                            let conn = state.conn.lock().unwrap();
                            let _ = db::set_setting(&conn, "reminders_paused", "false");
                            let _ = app.emit("reminders_paused", false);
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
