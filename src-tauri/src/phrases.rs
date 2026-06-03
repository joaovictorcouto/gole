use rand::seq::SliceRandom;
use rand::thread_rng;

#[derive(Clone)]
pub struct Phrase {
    pub text: &'static str,
    pub category: &'static str,
}

pub fn get_phrases() -> Vec<Phrase> {
    vec![
        // Humor
        Phrase { text: "Seu corpo é 60% água. Não deixe ele virar um deserto! 🌵", category: "humor" },
        Phrase { text: "A planta da sua sala bebe mais água que você.", category: "humor" },
        Phrase { text: "Até o peixe sabe que precisa de água.", category: "humor" },
        Phrase { text: "Café não conta. Tente outra vez.", category: "humor" },
        Phrase { text: "Se você fosse uma usina, já teria desligado. Beba água!", category: "humor" },
        // Geek
        Phrase { text: "Hidratação crítica! Nível de HP caindo... 💧", category: "geek" },
        Phrase { text: "Error 404: Água não encontrada no seu sistema.", category: "geek" },
        Phrase { text: "Execute: sudo apt-get install water", category: "geek" },
        Phrase { text: "Stack Overflow tem uma solução: beber água.", category: "geek" },
        Phrase { text: "Seu processador precisa de refrigeração líquida. 🖥️", category: "geek" },
        // Escritório
        Phrase { text: "A reunião pode esperar. A sua saúde não.", category: "escritorio" },
        Phrase { text: "Pausa para hidratação aprovada pelo seu gerente de saúde.", category: "escritorio" },
        Phrase { text: "Item #1 da pauta: beber água agora.", category: "escritorio" },
        Phrase { text: "KPI do dia: meta de hidratação batida. ✅", category: "escritorio" },
        Phrase { text: "Reunião cancelada. Horário livre para beber água.", category: "escritorio" },
        // Motivacional
        Phrase { text: "Grandes resultados começam com pequenos goles. 💪", category: "motivacional" },
        Phrase { text: "Você está construindo um hábito. Um gole de cada vez.", category: "motivacional" },
        Phrase { text: "Campeões bebem água. E você é um campeão.", category: "motivacional" },
        Phrase { text: "Cada gole é um passo em direção à sua melhor versão.", category: "motivacional" },
        Phrase { text: "A disciplina de hoje constrói o bem-estar de amanhã.", category: "motivacional" },
        // Minimalista
        Phrase { text: "Hora da água.", category: "minimalista" },
        Phrase { text: "Beba.", category: "minimalista" },
        Phrase { text: "Um gole agora.", category: "minimalista" },
        Phrase { text: "Pausa. Hidrate-se.", category: "minimalista" },
        Phrase { text: "Água. Agora.", category: "minimalista" },
    ]
}

pub fn pick_phrase(personality: &str, recent_texts: &[String]) -> Phrase {
    let all = get_phrases();
    let candidates: Vec<Phrase> = all
        .into_iter()
        .filter(|p| {
            let matches_personality = match personality {
                "mixed" => true,
                cat => p.category == cat,
            };
            let not_recent = !recent_texts.contains(&p.text.to_string());
            matches_personality && not_recent
        })
        .collect();

    let pool = if candidates.is_empty() {
        get_phrases()
    } else {
        candidates
    };

    let mut rng = thread_rng();
    pool.choose(&mut rng).cloned().unwrap_or(Phrase {
        text: "Hora de beber água! 💧",
        category: "minimalista",
    })
}
