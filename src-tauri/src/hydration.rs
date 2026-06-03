/// Calculate daily hydration goal in ml
pub fn calculate_goal(weight_kg: f64, activity_level: &str, climate: &str) -> i64 {
    let base = weight_kg * 35.0;
    let activity_bonus = match activity_level {
        "sedentary" => 0.0,
        "light" => 300.0,
        "moderate" => 600.0,
        "active" => 1000.0,
        _ => 0.0,
    };
    let climate_bonus = match climate {
        "cold" => 0.0,
        "temperate" => 200.0,
        "hot" => 500.0,
        _ => 200.0,
    };
    (base + activity_bonus + climate_bonus) as i64
}

/// Suggested ml per reminder
pub fn suggested_per_reminder(goal_ml: i64, interval_min: i64) -> i64 {
    let wake_hours = 16.0f64;
    let reminders_per_day = (wake_hours * 60.0 / interval_min as f64).floor() as i64;
    if reminders_per_day == 0 {
        return goal_ml;
    }
    goal_ml / reminders_per_day
}
