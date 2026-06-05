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

pub fn calculate_active_hours(start: &str, end: &str) -> f64 {
    let parse_time = |s: &str| -> Option<(f64, f64)> {
        let parts: Vec<&str> = s.split(':').collect();
        if parts.len() == 2 {
            let h = parts[0].parse::<f64>().ok()?;
            let m = parts[1].parse::<f64>().ok()?;
            Some((h, m))
        } else {
            None
        }
    };

    if let (Some((sh, sm)), Some((eh, em))) = (parse_time(start), parse_time(end)) {
        let start_min = sh * 60.0 + sm;
        let mut end_min = eh * 60.0 + em;
        if end_min <= start_min {
            // Se passar da meia-noite
            end_min += 24.0 * 60.0;
        }
        (end_min - start_min) / 60.0
    } else {
        16.0 // padrão se falhar
    }
}

fn ceil_div(a: i64, b: i64) -> i64 {
    if b <= 0 { return a; }
    (a + b - 1) / b
}

/// Number of sips per reminder. Always rounds UP so the user meets or
/// exceeds the daily goal (never less).
pub fn sips_per_reminder(goal_ml: i64, interval_min: i64, start_hour: &str, end_hour: &str, sip_ml: i64) -> i64 {
    if sip_ml <= 0 { return 1; }
    let total_sips = ceil_div(goal_ml, sip_ml);
    let wake_hours = calculate_active_hours(start_hour, end_hour);
    let reminders_per_day = (wake_hours * 60.0 / interval_min as f64).floor() as i64;
    if reminders_per_day <= 0 {
        return total_sips;
    }
    ceil_div(total_sips, reminders_per_day).max(1)
}

/// Suggested ml per reminder (always a whole number of sips, rounded up).
pub fn suggested_per_reminder(goal_ml: i64, interval_min: i64, start_hour: &str, end_hour: &str, sip_ml: i64) -> i64 {
    sips_per_reminder(goal_ml, interval_min, start_hour, end_hour, sip_ml) * sip_ml.max(1)
}

/// Sips per remaining slot given how much was already consumed and how many
/// slots are still ahead today. Rounds up so the daily goal is met or
/// exceeded (never less). If consumption already meets the goal or no
/// slots remain, returns 1 as a safety floor.
pub fn sips_per_remaining_slot(goal_ml: i64, consumed_ml: i64, sip_ml: i64, slots_remaining: i64) -> i64 {
    if sip_ml <= 0 || slots_remaining <= 0 {
        return 1;
    }
    let remaining_ml = (goal_ml - consumed_ml).max(0);
    if remaining_ml == 0 {
        return 0;
    }
    let total_sips = ceil_div(remaining_ml, sip_ml);
    ceil_div(total_sips, slots_remaining).max(1)
}


