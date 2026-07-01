export interface ChangelogEntry {
  icon: string;
  title: string;
  description: string;
}

export interface ChangelogVersion {
  version: string;
  date: string;
  highlight?: string;
  entries: ChangelogEntry[];
}

// Latest first. Add new versions to the top.
export const CHANGELOG: ChangelogVersion[] = [
  {
    version: "1.0.5",
    date: "2026-07-01",
    highlight: "Conheça o Modo Escuro nativo, o Modo Básico e as novas aparências do Dashboard!",
    entries: [
      {
        icon: "dark_mode",
        title: "Modo Escuro Nativo Premium",
        description:
          "Agora o GOLE oferece um tema escuro completo e refinado para o seu desktop, reduzindo a fadiga visual. Você pode escolher entre os temas Claro, Escuro ou sincronizar automaticamente com as preferências do seu Sistema.",
      },
      {
        icon: "spa",
        title: "Modo Básico Simplificado",
        description:
          "Para quem busca simplicidade absoluta, o app agora conta com o Modo Básico: removemos metas, volumes calculados e estatísticas complexas, focando exclusivamente em lembretes de intervalo simples.",
      },
      {
        icon: "dashboard",
        title: "Dois Estilos de Dashboard (Aparências 1 e 2)",
        description:
          "Escolha entre duas opções de visual: o Dashboard 1 (foco clássico no botão central gigante) e o Dashboard 2 (design moderno e compacto integrado com histórico em colunas, ideal para multitarefas).",
      },
      {
        icon: "shortcut",
        title: "Atalhos Rápidos no Menu Lateral",
        description:
          "Alternar o tema ou o visual do seu Dashboard ficou mais prático: adicionamos botões minimalistas rápidos diretamente no rodapé da barra lateral esquerda.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-04",
    highlight: "Bem-vindo ao GOLE — guia rápido das funcionalidades.",
    entries: [
      {
        icon: "flight_takeoff",
        title: "Onboarding personalizado",
        description:
          "Na primeira execução o GOLE calcula sua meta diária de água com base em peso, idade, nível de atividade e clima.",
      },
      {
        icon: "water_drop",
        title: "Dashboard de hidratação",
        description:
          "Acompanhe seu progresso em tempo real com copo animado, percentual da meta e botões rápidos para registrar doses.",
      },
      {
        icon: "local_drink",
        title: "Recipiente principal",
        description:
          "Configure sua garrafa ou copo favorito (200ml–2000ml) para registrar doses com um clique.",
      },
      {
        icon: "notifications_active",
        title: "Lembretes inteligentes",
        description:
          "Notificações em intervalos configuráveis (30min a 2h) com som customizável e janela de período ativo.",
      },
      {
        icon: "campaign",
        title: "Personalidade das mensagens",
        description:
          "Escolha o tom das frases dos lembretes: profissional, equilibrado, brincalhão ou personalizadas suas.",
      },
      {
        icon: "edit_note",
        title: "Gerenciador de frases",
        description:
          "Favorite as mensagens que mais gosta, crie frases próprias e organize por categoria nas configurações.",
      },
      {
        icon: "monitoring",
        title: "Estatísticas e histórico",
        description:
          "Visualize seu histórico de 7, 30 ou 60 dias em garrafas interativas. Edite quantidade e horário de qualquer registro.",
      },
      {
        icon: "emoji_events",
        title: "Conquistas",
        description:
          "Desbloqueie conquistas conforme mantém a hidratação em dia e bate metas consecutivas.",
      },
      {
        icon: "schedule",
        title: "Pausa e horário ativo",
        description:
          "Defina o período do dia em que recebe lembretes e pause quando precisar — reativação automática no dia seguinte.",
      },
      {
        icon: "rocket_launch",
        title: "Auto-start e atualizações",
        description:
          "Inicie o GOLE junto com o sistema e receba atualizações automáticas silenciosas via GitHub.",
      },
    ],
  },
];
