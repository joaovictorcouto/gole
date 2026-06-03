import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

const ACHIEVEMENT_META: Record<string, { icon: string; title: string; description: string }> = {
  first_day: {
    icon: "🌱",
    title: "Primeiro Dia",
    description: "Bebeu água pela primeira vez no GOLE",
  },
  goal_complete: {
    icon: "🏆",
    title: "Meta Completa",
    description: "Atingiu a meta diária pela primeira vez",
  },
  streak_7: {
    icon: "🔥",
    title: "7 Dias Seguidos",
    description: "Manteve a meta por 7 dias consecutivos",
  },
  streak_30: {
    icon: "💎",
    title: "30 Dias Seguidos",
    description: "Um mês inteiro de hidratação consistente",
  },
  streak_100: {
    icon: "🚀",
    title: "100 Dias Seguidos",
    description: "Incrível dedicação à sua saúde",
  },
  liters_100: {
    icon: "🌊",
    title: "100 Litros",
    description: "Consumiu 100 litros de água com o GOLE",
  },
  streak_3: {
    icon: "✨",
    title: "Trio Hidratado",
    description: "Cumpriu a meta 3 dias seguidos",
  },
  streak_14: {
    icon: "🌟",
    title: "14 Dias Seguidos",
    description: "Duas semanas inteiras batendo a meta",
  },
  liters_10: {
    icon: "💧",
    title: "10 Litros",
    description: "Consumiu seus primeiros 10 litros no GOLE",
  },
  liters_50: {
    icon: "🚰",
    title: "50 Litros",
    description: "Consumiu 50 litros de água no total",
  },
  liters_500: {
    icon: "🏆",
    title: "500 Litros",
    description: "Marco de meio milhão de mililitros",
  },
  active_7: {
    icon: "📅",
    title: "Semana Ativa",
    description: "Usou o GOLE em 7 dias diferentes",
  },
  active_30: {
    icon: "🗓️",
    title: "Mês Ativo",
    description: "Usou o GOLE em 30 dias diferentes",
  },
  goal_10_days: {
    icon: "🎯",
    title: "Meta em 10 Dias",
    description: "Bateu a meta diária em 10 dias (não necessariamente seguidos)",
  },
  goal_50_days: {
    icon: "🥇",
    title: "Meta em 50 Dias",
    description: "Bateu a meta diária em 50 dias no total",
  },
  big_gulp: {
    icon: "🥤",
    title: "Goldão",
    description: "Registrou 1L ou mais em um único registro",
  },
  early_bird: {
    icon: "🌅",
    title: "Madrugador",
    description: "Bebeu água antes das 7h da manhã",
  },
  night_owl: {
    icon: "🌙",
    title: "Coruja",
    description: "Bebeu água depois das 22h",
  },
  overflow_day: {
    icon: "🔥",
    title: "Acima da Meta",
    description: "Passou de 120% da meta em um único dia",
  },
  weekend_warrior: {
    icon: "🏖️",
    title: "Guerreiro de Fim de Semana",
    description: "Cumpriu a meta em um sábado e domingo da mesma semana",
  },
};

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Achievements() {
  const { achievements, loadAchievements } = useAppStore();

  useEffect(() => {
    loadAchievements();
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked_at !== null);
  const locked = achievements.filter((a) => a.unlocked_at === null);

  return (
    <div className="flex flex-col h-full" style={{ marginLeft: "280px" }}>
      <header className="px-10 pt-10 pb-6 shrink-0">
        <h1 className="text-5xl font-semibold mb-2" style={{ color: "#3b6377", letterSpacing: "-0.04em" }}>
          Conquistas
        </h1>
        <p className="text-lg" style={{ color: "#41484c" }}>
          {unlocked.length} de {achievements.length} conquistas desbloqueadas.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#5B6572" }}>
            Desbloqueadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlocked.map((a) => {
              const meta = ACHIEVEMENT_META[a.id];
              if (!meta) return null;
              return (
                <div key={a.id} className="bg-white rounded-xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:border-[#006492]"
                  style={{
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    borderColor: "rgba(255,255,255,0.2)",
                  }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                    style={{ backgroundColor: "rgba(191,232,255,0.5)" }}>
                    {meta.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
                    {meta.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: "#5B6572" }}>{meta.description}</p>
                  {a.unlocked_at && (
                    <p className="text-xs font-semibold tracking-wider" style={{ color: "#3b6377" }}>
                      ✓ {formatDate(a.unlocked_at)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#5B6572" }}>
            Em progresso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locked.map((a) => {
              const meta = ACHIEVEMENT_META[a.id];
              if (!meta) return null;
              return (
                <div key={a.id} className="rounded-xl p-6 border"
                  style={{
                    backgroundColor: "#f2f4f7",
                    borderColor: "#e6e8eb",
                    opacity: 0.7,
                  }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 grayscale opacity-50"
                    style={{ backgroundColor: "#e0e3e6" }}>
                    {meta.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: "#71787c", letterSpacing: "-0.01em" }}>
                    {meta.title}
                  </h3>
                  <p className="text-sm" style={{ color: "#71787c" }}>{meta.description}</p>
                  <p className="text-xs font-semibold tracking-wider mt-3" style={{ color: "#c1c7cc" }}>
                    🔒 Bloqueada
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {achievements.length === 0 && (
        <div className="text-center py-20">
          <span className="text-5xl">🏆</span>
          <p className="text-lg mt-4" style={{ color: "#5B6572" }}>
            Comece a beber água para desbloquear conquistas!
          </p>
        </div>
      )}

      </div>{/* end scrollable */}
    </div>
  );
}
