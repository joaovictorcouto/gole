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

        CREATE TABLE IF NOT EXISTS phrases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            favorite INTEGER NOT NULL DEFAULT 0,
            is_custom INTEGER NOT NULL DEFAULT 0,
            displayed INTEGER NOT NULL DEFAULT 0
        );

        INSERT OR IGNORE INTO settings (key, value) VALUES ('onboarding_complete', 'false');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('weight_kg', '70');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('age_years', '25');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('activity_level', 'sedentary');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('climate', 'temperate');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('daily_goal_ml', '2450');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('reminder_interval_min', '60');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('notification_personality', 'tudo');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('smart_mode', 'true');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('reminders_paused', 'false');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('autostart', 'false');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('last_data_check_date', '');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('recipiente_configurado', 'false');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('recipiente_capacidade_ml', '500');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('sound_preset', 'gota');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('sound_volume', '70');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('work_start_hour', '08:00');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('work_end_hour', '18:00');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('sip_ml', '20');

        -- Profissional
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Hora da água.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Beba água.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Hora de hidratar.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo agradece.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Hidrate-se.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Água primeiro.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Momento água.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Pequeno lembrete.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Não esqueça da água.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu próximo gole chegou.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo merece esse cuidado.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 O melhor momento para beber água é agora.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Hidratação também é autocuidado.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Faça algo bom por você nos próximos 15 segundos.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo trabalha por você o dia inteiro.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Recompense-se com água.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Saúde é construída em pequenas decisões.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Um gole por vez.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Continue construindo bons hábitos.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Mais um passo concluído.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu bem-estar é um investimento.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Bons hábitos acontecem aos poucos.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Um copo agora. Benefícios o dia inteiro.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Continue.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Você não precisa esperar sentir sede.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu organismo enviou um lembrete amigável.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Não é urgente. Mas é importante.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu dia fica melhor quando você se hidrata.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu próximo gole pode começar agora.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Um gole agora vale mais do que lembrar depois.', 'profissional');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Sua água está esperando por você pacientemente.', 'profissional');

        -- Equilibrado
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Água agora. Seu eu do futuro agradece.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Missão rápida: tomar um gole e voltar.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Leva menos tempo que abrir o Instagram.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Pequena pausa. Grande benefício.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 A melhor atualização de hoje cabe em um copo.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo está esperando uma entrega.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 A sede está tentando falar com você.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu próximo gole está te esperando.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Pequena tarefa. Grande retorno.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Sua próxima entrega é um gole de água.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Essa tarefa leva menos de 30 segundos.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Sua produtividade gosta de água.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Reuniões terminam. A sede continua.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 O próximo gole está a uma mão de distância.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu cérebro aprecia combustível líquido.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Água: simples, barata e surpreendentemente eficaz.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Se você leu isso, já está perto de beber água.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Antes de abrir outra aba, beba um pouco de água.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Um hábito saudável está chamando seu nome.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Você cuida dos seus dispositivos. Cuide de você também.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 A sede costuma chegar atrasada. A hidratação não precisa.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 A hidratação de agora evita a preguiça de depois.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Menos desculpas. Mais água.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Vale a pena.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Rapidinho.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Só um minuto.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Pausa rápida.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Um gole resolve isso.', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Água?', 'equilibrado');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu copo sente sua falta.', 'equilibrado');

        -- Brincalhão
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu rim pediu para avisar que está aceitando água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Você lembra de carregar o celular. E você?', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 O café não substitui água. Ele tentou.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Atualização disponível: versão hidratada de você.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Beba água antes que sua boca vire o deserto do Saara.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo está digitando: água água água água água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Hidrate-se. Seus órgãos trabalham sem férias.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Água: DLC gratuita para aumentar performance.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo agradeceria se pudesse mandar mensagens.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Só um copo. Nem precisa de tutorial.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Você já rolou bastante a tela hoje. Hora de um gole.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 A água está disponível sem anúncios.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Aviso: nível de hidratação abaixo do recomendado.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Sistema operacional humano requer água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Patch de desempenho disponível.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 CPU está ok. Usuário está seco.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Erro 404: água não encontrada.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Atualizando componente: Humano.exe.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu sistema detectou baixa hidratação.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Recurso necessário não encontrado: água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Reinicie seu nível de hidratação.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Atualização crítica recomendada.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Status do sistema: precisa de água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Ping recebido do departamento dos rins.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Processo hydration.exe aguardando execução.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Nenhum bug foi corrigido. Apenas beba água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu hardware pede manutenção preventiva.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Memória RAM limpa. Garrafa vazia.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Latência entre você e a água detectada.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Servidor corporal operando abaixo do ideal.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Upgrade gratuito disponível.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Reunião com a água. Duração estimada: 15 segundos.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu copo está aguardando aprovação.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Ticket aberto: necessidade de hidratação.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 KPI do dia: mais água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Pendência detectada: beber água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Prazo para hidratação vencendo.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Solicitação enviada pelos seus órgãos.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Alinhe expectativas com seu copo.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 O departamento interno recomenda hidratação.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Checklist do dia: água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Demanda urgente do setor biológico.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 O relatório indica baixa ingestão de água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu copo segue disponível para atendimento.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Item pendente identificado.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Favor responder à solicitação do seu organismo.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo está rodando no modo economia de água.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Uma garrafa cheia é um problema resolvido antes de existir.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Água: a funcionalidade mais subestimada do corpo humano.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Seu corpo abriu um chamado urgente.', 'brincalhao');
        INSERT OR IGNORE INTO phrases (text, category) VALUES ('💧 Água: upgrade gratuito de desempenho.', 'brincalhao');
    ")
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Settings {
    pub onboarding_complete: bool,
    pub weight_kg: f64,
    pub age_years: i64,
    pub activity_level: String,
    pub climate: String,
    pub daily_goal_ml: i64,
    pub reminder_interval_min: i64,
    pub notification_personality: String,
    pub smart_mode: bool,
    pub reminders_paused: bool,
    pub autostart: bool,
    pub last_data_check_date: String,
    pub recipiente_configurado: bool,
    pub recipiente_capacidade_ml: i64,
    pub sound_preset: String,
    pub sound_volume: i64,
    pub work_start_hour: String,
    pub work_end_hour: String,
    pub sip_ml: i64,
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
    let personality = map.get("notification_personality").cloned().unwrap_or_else(|| "tudo".into());
    let personality = if personality == "mixed" { "tudo".to_string() } else { personality };

    Ok(Settings {
        onboarding_complete: map.get("onboarding_complete").map(|v| v == "true").unwrap_or(false),
        weight_kg: map.get("weight_kg").and_then(|v| v.parse().ok()).unwrap_or(70.0),
        age_years: map.get("age_years").and_then(|v| v.parse().ok()).unwrap_or(25),
        activity_level: map.get("activity_level").cloned().unwrap_or_else(|| "sedentary".into()),
        climate: map.get("climate").cloned().unwrap_or_else(|| "temperate".into()),
        daily_goal_ml: map.get("daily_goal_ml").and_then(|v| v.parse().ok()).unwrap_or(2450),
        reminder_interval_min: map.get("reminder_interval_min").and_then(|v| v.parse().ok()).unwrap_or(60),
        notification_personality: personality,
        smart_mode: map.get("smart_mode").map(|v| v == "true").unwrap_or(true),
        reminders_paused: map.get("reminders_paused").map(|v| v == "true").unwrap_or(false),
        autostart: map.get("autostart").map(|v| v == "true").unwrap_or(false),
        last_data_check_date: map.get("last_data_check_date").cloned().unwrap_or_default(),
        recipiente_configurado: map.get("recipiente_configurado").map(|v| v == "true").unwrap_or(false),
        recipiente_capacidade_ml: map.get("recipiente_capacidade_ml").and_then(|v| v.parse().ok()).unwrap_or(500),
        sound_preset: map.get("sound_preset").cloned().unwrap_or_else(|| "gota".into()),
        sound_volume: map.get("sound_volume").and_then(|v| v.parse().ok()).unwrap_or(70),
        work_start_hour: map.get("work_start_hour").cloned().unwrap_or_else(|| "08:00".into()),
        work_end_hour: map.get("work_end_hour").cloned().unwrap_or_else(|| "18:00".into()),
        sip_ml: map.get("sip_ml").and_then(|v| v.parse().ok()).unwrap_or(20),
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DrinkLog {
    pub id: i64,
    pub amount_ml: i64,
    pub logged_at: String,
}

pub fn get_today_drinks(conn: &Connection, date: &str) -> Result<Vec<DrinkLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, amount_ml, logged_at FROM daily_logs WHERE date = ?1 ORDER BY logged_at DESC"
    )?;
    let rows = stmt.query_map(params![date], |row| {
        Ok(DrinkLog {
            id: row.get(0)?,
            amount_ml: row.get(1)?,
            logged_at: row.get(2)?,
        })
    })?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

pub fn update_drink(conn: &Connection, id: i64, amount_ml: i64, logged_at: &str) -> Result<()> {
    conn.execute(
        "UPDATE daily_logs SET amount_ml = ?1, logged_at = ?2 WHERE id = ?3",
        params![amount_ml, logged_at, id],
    )?;
    Ok(())
}

pub fn delete_drink(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM daily_logs WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn delete_last_drink(conn: &Connection, date: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM daily_logs WHERE id = (SELECT id FROM daily_logs WHERE date = ?1 ORDER BY logged_at DESC LIMIT 1)",
        params![date],
    )?;
    Ok(())
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

pub fn get_range_stats(conn: &Connection, goal_ml: i64, start_date: &str, end_date: &str) -> Result<Vec<DayStats>> {
    let mut stmt = conn.prepare("
        SELECT date, SUM(amount_ml) as consumed
        FROM daily_logs
        WHERE date >= ?1 AND date <= ?2
        GROUP BY date
        ORDER BY date ASC
    ")?;
    let rows = stmt.query_map(params![start_date, end_date], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    let mut map = std::collections::HashMap::new();
    for row in rows {
        let (date, consumed) = row?;
        map.insert(date, consumed);
    }

    // Build a continuous range — include days with 0 ml
    let mut result = Vec::new();
    let start = chrono::NaiveDate::parse_from_str(start_date, "%Y-%m-%d")
        .map_err(|_| rusqlite::Error::InvalidQuery)?;
    let end = chrono::NaiveDate::parse_from_str(end_date, "%Y-%m-%d")
        .map_err(|_| rusqlite::Error::InvalidQuery)?;
    let mut d = start;
    while d <= end {
        let key = d.format("%Y-%m-%d").to_string();
        let consumed = *map.get(&key).unwrap_or(&0);
        result.push(DayStats {
            date: key,
            goal_ml,
            consumed_ml: consumed,
            reminders_sent: 0,
            reminders_confirmed: 0,
        });
        match d.succ_opt() {
            Some(next) => d = next,
            None => break,
        }
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
        "first_day", "goal_complete",
        "streak_3", "streak_7", "streak_14", "streak_30", "streak_100",
        "liters_10", "liters_50", "liters_100", "liters_500",
        "active_7", "active_30",
        "goal_10_days", "goal_50_days",
        "big_gulp", "early_bird", "night_owl", "overflow_day", "weekend_warrior",
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

// Achievement helpers
pub fn has_drink_before_hour(conn: &Connection, hour: i64) -> Result<bool> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM daily_logs WHERE CAST(strftime('%H', logged_at) AS INTEGER) < ?1",
        params![hour],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

pub fn has_drink_after_hour(conn: &Connection, hour: i64) -> Result<bool> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM daily_logs WHERE CAST(strftime('%H', logged_at) AS INTEGER) >= ?1",
        params![hour],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

pub fn max_single_drink(conn: &Connection) -> Result<i64> {
    conn.query_row(
        "SELECT COALESCE(MAX(amount_ml), 0) FROM daily_logs",
        [],
        |row| row.get(0),
    )
}

pub fn distinct_days_with_logs(conn: &Connection) -> Result<i64> {
    conn.query_row(
        "SELECT COUNT(DISTINCT date) FROM daily_logs",
        [],
        |row| row.get(0),
    )
}

pub fn days_goal_reached_count(conn: &Connection, goal_ml: i64) -> Result<i64> {
    conn.query_row(
        "SELECT COUNT(*) FROM (SELECT date, SUM(amount_ml) AS total FROM daily_logs GROUP BY date HAVING total >= ?1)",
        params![goal_ml],
        |row| row.get(0),
    )
}

/// True if there's any pair of (Sat, Sun) in the same ISO week where both reached the goal.
pub fn weekend_warrior(conn: &Connection, goal_ml: i64) -> Result<bool> {
    // Get distinct dates >= goal
    let mut stmt = conn.prepare(
        "SELECT date FROM (SELECT date, SUM(amount_ml) AS total FROM daily_logs GROUP BY date HAVING total >= ?1)"
    )?;
    let rows = stmt.query_map(params![goal_ml], |row| row.get::<_, String>(0))?;
    let mut sat_weeks: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut sun_weeks: std::collections::HashSet<String> = std::collections::HashSet::new();
    for r in rows {
        let date_str = r?;
        if let Ok(d) = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d") {
            use chrono::Datelike;
            let week_key = format!("{}-W{}", d.iso_week().year(), d.iso_week().week());
            match d.weekday() {
                chrono::Weekday::Sat => { sat_weeks.insert(week_key); }
                chrono::Weekday::Sun => { sun_weeks.insert(week_key); }
                _ => {}
            }
        }
    }
    Ok(sat_weeks.intersection(&sun_weeks).next().is_some())
}

/// Did the user reach >= 120% of goal in any single day?
pub fn has_overflow_day(conn: &Connection, goal_ml: i64) -> Result<bool> {
    let threshold = (goal_ml as f64 * 1.2) as i64;
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM (SELECT date, SUM(amount_ml) AS total FROM daily_logs GROUP BY date HAVING total >= ?1)",
        params![threshold],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}
