use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub fn get_db_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("gole.db")
}

pub fn init_db(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=NORMAL;

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS daily_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            amount_ml INTEGER NOT NULL,
            logged_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sent_at TEXT NOT NULL,
            confirmed INTEGER NOT NULL DEFAULT 0,
            snoozed INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            unlocked_at TEXT
        );

        CREATE TABLE IF NOT EXISTS streak_log (
            date TEXT PRIMARY KEY,
            goal_ml INTEGER NOT NULL,
            consumed_ml INTEGER NOT NULL
        );

        INSERT OR IGNORE INTO settings (key, value) VALUES ('onboarding_complete', 'false');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('weight_kg', '70');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('activity_level', 'sedentary');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('climate', 'temperate');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('daily_goal_ml', '2450');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('reminder_interval_min', '60');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('notification_personality', 'mixed');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('smart_mode', 'true');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('reminders_paused', 'false');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('autostart', 'false');
    ")
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Settings {
    pub onboarding_complete: bool,
    pub weight_kg: f64,
    pub activity_level: String,
    pub climate: String,
    pub daily_goal_ml: i64,
    pub reminder_interval_min: i64,
    pub notification_personality: String,
    pub smart_mode: bool,
    pub reminders_paused: bool,
    pub autostart: bool,
}

pub fn get_settings(conn: &Connection) -> Result<Settings> {
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let mut map = std::collections::HashMap::new();
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    for row in rows {
        let (k, v) = row?;
        map.insert(k, v);
    }
    Ok(Settings {
        onboarding_complete: map.get("onboarding_complete").map(|v| v == "true").unwrap_or(false),
        weight_kg: map.get("weight_kg").and_then(|v| v.parse().ok()).unwrap_or(70.0),
        activity_level: map.get("activity_level").cloned().unwrap_or_else(|| "sedentary".into()),
        climate: map.get("climate").cloned().unwrap_or_else(|| "temperate".into()),
        daily_goal_ml: map.get("daily_goal_ml").and_then(|v| v.parse().ok()).unwrap_or(2450),
        reminder_interval_min: map.get("reminder_interval_min").and_then(|v| v.parse().ok()).unwrap_or(60),
        notification_personality: map.get("notification_personality").cloned().unwrap_or_else(|| "mixed".into()),
        smart_mode: map.get("smart_mode").map(|v| v == "true").unwrap_or(true),
        reminders_paused: map.get("reminders_paused").map(|v| v == "true").unwrap_or(false),
        autostart: map.get("autostart").map(|v| v == "true").unwrap_or(false),
    })
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DayStats {
    pub date: String,
    pub goal_ml: i64,
    pub consumed_ml: i64,
    pub reminders_sent: i64,
    pub reminders_confirmed: i64,
}

pub fn get_today_consumed(conn: &Connection, date: &str) -> Result<i64> {
    let total: i64 = conn.query_row(
        "SELECT COALESCE(SUM(amount_ml), 0) FROM daily_logs WHERE date = ?1",
        params![date],
        |row| row.get(0),
    )?;
    Ok(total)
}

pub fn log_drink(conn: &Connection, date: &str, amount_ml: i64, logged_at: &str) -> Result<i64> {
    conn.execute(
        "INSERT INTO daily_logs (date, amount_ml, logged_at) VALUES (?1, ?2, ?3)",
        params![date, amount_ml, logged_at],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_week_stats(conn: &Connection, goal_ml: i64) -> Result<Vec<DayStats>> {
    let mut stmt = conn.prepare("
        SELECT date, SUM(amount_ml) as consumed
        FROM daily_logs
        WHERE date >= date('now', '-6 days')
        GROUP BY date
        ORDER BY date ASC
    ")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    let mut map = std::collections::HashMap::new();
    for row in rows {
        let (date, consumed) = row?;
        map.insert(date, consumed);
    }

    let mut result = Vec::new();
    for i in (0..7i64).rev() {
        let date: String = conn.query_row(
            "SELECT date('now', ?1 || ' days')",
            params![format!("-{}", i)],
            |row| row.get(0),
        )?;
        let consumed = *map.get(&date).unwrap_or(&0);
        result.push(DayStats {
            date: date.clone(),
            goal_ml,
            consumed_ml: consumed,
            reminders_sent: 0,
            reminders_confirmed: 0,
        });
    }
    Ok(result)
}

pub fn get_month_stats(conn: &Connection, goal_ml: i64) -> Result<Vec<DayStats>> {
    let mut stmt = conn.prepare("
        SELECT date, SUM(amount_ml) as consumed
        FROM daily_logs
        WHERE date >= date('now', '-29 days')
        GROUP BY date
        ORDER BY date ASC
    ")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    let mut result = Vec::new();
    for row in rows {
        let (date, consumed) = row?;
        result.push(DayStats {
            date,
            goal_ml,
            consumed_ml: consumed,
            reminders_sent: 0,
            reminders_confirmed: 0,
        });
    }
    Ok(result)
}

pub fn get_streak(conn: &Connection, goal_ml: i64) -> Result<i64> {
    let mut streak: i64 = 0;
    let mut i = 0i64;
    loop {
        let date: String = conn.query_row(
            "SELECT date('now', ?1 || ' days')",
            params![format!("-{}", i)],
            |row| row.get(0),
        )?;
        let consumed: i64 = conn.query_row(
            "SELECT COALESCE(SUM(amount_ml), 0) FROM daily_logs WHERE date = ?1",
            params![date],
            |row| row.get(0),
        )?;
        if consumed >= goal_ml {
            streak += 1;
            i += 1;
        } else {
            break;
        }
    }
    Ok(streak)
}

pub fn log_reminder(conn: &Connection, sent_at: &str) -> Result<i64> {
    conn.execute(
        "INSERT INTO reminders (sent_at, confirmed, snoozed) VALUES (?1, 0, 0)",
        params![sent_at],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn confirm_reminder(conn: &Connection, id: i64) -> Result<()> {
    conn.execute(
        "UPDATE reminders SET confirmed = 1 WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

pub fn snooze_reminder(conn: &Connection, id: i64) -> Result<()> {
    conn.execute(
        "UPDATE reminders SET snoozed = 1 WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

pub fn get_today_reminders(conn: &Connection, date: &str) -> Result<(i64, i64)> {
    let sent: i64 = conn.query_row(
        "SELECT COUNT(*) FROM reminders WHERE date(sent_at) = ?1",
        params![date],
        |row| row.get(0),
    )?;
    let confirmed: i64 = conn.query_row(
        "SELECT COUNT(*) FROM reminders WHERE date(sent_at) = ?1 AND confirmed = 1",
        params![date],
        |row| row.get(0),
    )?;
    Ok((sent, confirmed))
}

pub fn unlock_achievement(conn: &Connection, id: &str, unlocked_at: &str) -> Result<bool> {
    let existing: i64 = conn.query_row(
        "SELECT COUNT(*) FROM achievements WHERE id = ?1 AND unlocked_at IS NOT NULL",
        params![id],
        |row| row.get(0),
    )?;
    if existing > 0 {
        return Ok(false);
    }
    conn.execute(
        "INSERT OR REPLACE INTO achievements (id, unlocked_at) VALUES (?1, ?2)",
        params![id, unlocked_at],
    )?;
    Ok(true)
}

pub fn get_achievements(conn: &Connection) -> Result<Vec<(String, Option<String>)>> {
    let achievement_ids = vec![
        "first_day", "goal_complete", "streak_7", "streak_30", "streak_100", "liters_100",
    ];
    let mut result = Vec::new();
    for id in &achievement_ids {
        let unlocked: Option<String> = conn
            .query_row(
                "SELECT unlocked_at FROM achievements WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .ok();
        result.push((id.to_string(), unlocked));
    }
    Ok(result)
}

pub fn get_total_consumed_liters(conn: &Connection) -> Result<f64> {
    let total_ml: i64 = conn.query_row(
        "SELECT COALESCE(SUM(amount_ml), 0) FROM daily_logs",
        [],
        |row| row.get(0),
    )?;
    Ok(total_ml as f64 / 1000.0)
}
