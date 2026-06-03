# AI_GUIDE — Mapa do Projeto GOLE

> **Objetivo:** este documento é a referência rápida para uma IA (ou desenvolvedor) localizar exatamente onde alterar algo no projeto sem precisar ler vários arquivos. Sempre consulte este guia ANTES de fazer modificações.
>
> **IMPORTANTE:** sempre que uma alteração significativa for feita no projeto, atualize este documento E o [CHANGELOG.md](CHANGELOG.md).

---

## 📋 Visão Geral

**GOLE** é um app desktop de hidratação construído com:
- **Tauri v2** + **Rust** (backend nativo, system tray, notificações, SQLite)
- **React + TypeScript** (frontend)
- **Tailwind CSS v4** (estilização via `@tailwindcss/vite`)
- **Zustand** (estado global)
- **React Router DOM** (roteamento)
- **SQLite via rusqlite** (persistência local, offline-first)

**Repositório:** https://github.com/joaovictorcouto/gole

---

## 🗂️ Estrutura de Pastas

```
gole/
├── AI_GUIDE.md              ← Este arquivo
├── CHANGELOG.md             ← Histórico de versões
├── index.html               ← HTML raiz (Material Symbols + Geist font)
├── package.json             ← Dependências NPM
├── vite.config.ts           ← Config Vite + Tailwind
├── tsconfig.json            ← Config TypeScript
│
├── src/                     ← FRONTEND (React)
│   ├── main.tsx             ← Entry point
│   ├── App.tsx              ← Router + onboarding flow + scheduler de lembretes
│   ├── index.css            ← Estilos globais + variáveis CSS + animações
│   │
│   ├── lib/
│   │   ├── api.ts           ← Wrappers tipados dos comandos Tauri (Rust)
│   │   └── featureFlags.ts  ← Feature flags (smartMode, achievements, etc.)
│   │
│   ├── store/
│   │   └── useAppStore.ts   ← Zustand store global
│   │
│   ├── lib/
│   │   ├── api.ts           ← Wrappers tipados dos comandos Tauri (Rust)
│   │   ├── featureFlags.ts  ← Feature flags
│   │   ├── format.ts        ← Helpers de formatação (volumes, datas)
│   │   └── sounds.ts        ← Sons de alerta gerados via Web Audio API
│   │
│   ├── components/ui/
│   │   ├── SideNav.tsx              ← Navegação lateral + botão Suporte
│   │   ├── WaterGlass.tsx           ← Copo virtual animado
│   │   ├── CircularProgress.tsx     ← Anel de progresso SVG
│   │   ├── UpdateProfileToast.tsx   ← Toast bimestral de revisão de perfil
│   │   ├── Toggle.tsx               ← Switch on/off
│   │   ├── Modal.tsx                ← Modal genérico reutilizável
│   │   ├── DatePicker.tsx           ← Calendário customizado (popover) com pt-BR
│   │   ├── DrinkHistoryModal.tsx    ← Edição de registros de QUALQUER dia
│   │   └── SupportModal.tsx         ← Form de bug/sugestão (mailto / GitHub issue)
│   │
│   └── pages/
│       ├── Dashboard.tsx        ← Tela principal + histórico clicável
│       ├── Statistics.tsx       ← Gráficos 7/30/90 dias + personalizado, tooltip fixed
│       ├── Achievements.tsx     ← 20 conquistas com auto-unlock retroativo
│       ├── Settings.tsx         ← Configurações (Gerais e Frases) + teste de notificação
│       ├── ReminderWindow.tsx   ← UI da janela customizada de lembrete (frameless/transparent)
│       └── onboarding/
│           └── Onboarding.tsx   ← TODAS as telas de onboarding em UM componente
│                                  (welcome → weight → activity → climate → recipiente_ask → recipiente_setup → result)
│                                  Estado interno via useState, sem rotas separadas.
│
└── src-tauri/               ← BACKEND (Rust)
    ├── Cargo.toml           ← Dependências Rust
    ├── tauri.conf.json      ← Config Tauri (janela, tray, plugins)
    ├── capabilities/default.json  ← Permissões da janela
    └── src/
        ├── main.rs          ← Entry point (chama gole_lib::run())
        ├── lib.rs           ← TODOS os comandos Tauri + setup tray + scheduler + motor anti-repetição
        ├── db.rs            ← Camada SQLite (settings, logs, reminders, achievements, phrases)
        └── hydration.rs     ← Fórmula de cálculo de meta diária
```

---

## 🎯 Onde Alterar O Quê (Cheat Sheet)

### Cálculo de hidratação (meta diária)
→ **`src-tauri/src/hydration.rs`** — função `calculate_goal()`
- Base: `peso × 35ml`
- Bônus de atividade: sedentary=0, light=300, moderate=600, active=1000
- Bônus de clima: cold=0, temperate=200, hot=500

### Frases das notificações
→ **`src-tauri/src/lib.rs`** — função `pick_phrase()`
- Tabela: `phrases` no SQLite (gerencia padrões e personalizadas de forma persistente).
- Categorias: `profissional`, `equilibrado`, `brincalhao`, `tudo`, `favoritas` e `personalizadas`.
- Sistema anti-repetição: redefinição automática quando todas as frases do pool da categoria selecionada tiverem sido exibidas.

### Banco de dados (schema, queries)
→ **`src-tauri/src/db.rs`**
- Tabelas: `settings`, `daily_logs`, `reminders`, `achievements`, `streak_log`, `phrases`
- Para adicionar coluna/tabela: editar `init_db()` (usar `CREATE TABLE IF NOT EXISTS`).

### Novo comando Tauri (Rust → frontend)
1. Adicionar função `#[tauri::command]` em **`src-tauri/src/lib.rs`**
2. Registrar em `tauri::generate_handler![...]` (no final do arquivo)
3. Adicionar wrapper tipado em **`src/lib/api.ts`**

### Feature Flags (ativar/desativar features)
→ **`src/lib/featureFlags.ts`**
- Flags ativas: `smartMode`, `achievements`, `statistics`
- Flags inativas (futuras): `cloudSync`, `mobileCompanion`, `smartWatch`, `aiSuggestions`, `adaptiveHydration`, `customThemes`
- Para usar no código: `isEnabled('flagName')`

### Cores / Design System
→ **`src/index.css`** — bloco `@theme`
- Paleta "Luminous Hydration": primary `#3b6377`, secondary `#0d658c`, surface `#f7f9fc`
- Para mudar tema, alterar variáveis `--color-*`

### System Tray (menu da bandeja)
→ **`src-tauri/src/lib.rs`** — bloco `TrayIconBuilder` dentro do `.setup()`
- Itens: `show`, `pause`, `resume`, `quit`

### Comportamento ao fechar a janela
→ **`src-tauri/src/lib.rs`** — `.on_window_event()` com `WindowEvent::CloseRequested`
- O botão [X] esconde a janela em vez de encerrar o app
- App continua rodando em segundo plano via system tray (baixo consumo de RAM)
- Para realmente encerrar: usar item "Sair" do tray menu

### Scheduler de lembretes
→ **`src/App.tsx`** — useEffect que chama `api.sendReminder()` a cada `reminder_interval_min`
- Lembrete é disparado pelo frontend; o Rust apenas registra e emite evento.

### Tela de Onboarding
→ **`src/pages/onboarding/Onboarding.tsx`** (arquivo único)
- Fluxo: Peso/Idade → Atividade Física → Clima → Recipiente Principal (Opcional) → Resultado.
- Estado interno via `useState<Step>`.
- Possui formulário de edição rápida de todos os dados inline no card de resultado (recalcula a meta de hidratação dinamicamente com 2 casas decimais).

### Dashboard (cards, copo, estatísticas)
→ **`src/pages/Dashboard.tsx`**
- Exibe consumo e meta com 2 casas decimais.
- Se o recipiente estiver configurado, exibe a meta convertida (ex.: `ou 5 garrafas de 700ml`).

### Conquistas
1. Adicionar metadata em **`src/pages/Achievements.tsx`** — objeto `ACHIEVEMENT_META`
2. Adicionar lógica de unlock em **`src-tauri/src/lib.rs`** — função `check_achievements_internal()`
3. Também atualizar a lista em **`src-tauri/src/db.rs`** — função `get_achievements()` (vec de IDs)
4. Conquistas atuais (20): `first_day`, `goal_complete`, `streak_3`, `streak_7`, `streak_14`, `streak_30`, `streak_100`, `liters_10`, `liters_50`, `liters_100`, `liters_500`, `active_7`, `active_30`, `goal_10_days`, `goal_50_days`, `big_gulp`, `early_bird`, `night_owl`, `overflow_day`, `weekend_warrior`
5. `check_achievements_internal` é chamado após cada `log_drink`/`confirm_reminder` E ao listar conquistas (auto-unlock retroativo)

### Janela customizada de lembrete
→ **`src-tauri/src/lib.rs`** — criação via `WebviewWindowBuilder` em `setup()` com label `"reminder"`
→ **`src/main.tsx`** — detecta `?window=reminder` na URL e renderiza `<ReminderWindow />` em vez de `<App />`
→ **`src/pages/ReminderWindow.tsx`** — UI estilizada (frameless, transparent, always-on-top, bottom-right do monitor)
- A janela substitui completamente a notificação OS nativa
- `send_reminder` no Rust mostra a janela e emite o evento `reminder` com payload completo
- Capabilities (`src-tauri/capabilities/default.json`) precisam incluir `"reminder"` em `windows`

### Edição de histórico
→ **`src/components/ui/DrinkHistoryModal.tsx`** aceita prop `date?: string`
- Sem `date`: opera em hoje
- Com `date`: opera no dia indicado (via comando `get_drinks_for_date`)
- Permite adicionar registro com horário customizado (input `time`) via comando `log_drink_at`
- Acessível pelo Dashboard (clicar no valor "Consumido") e pelo gráfico de Histórico em Estatísticas (clicar numa barra)

### Configurações (Settings)
→ **`src/pages/Settings.tsx`**
- Abas:
  - **Configurações Gerais**: Perfil/Medidas (peso, idade), Lembretes, Recipiente Principal, Notificações, Sistema.
  - **Gerenciamento de Frases**: Visualizar por categoria, favoritar/desfavoritar, CRUD de frases personalizadas.

---

## 🔄 Fluxo de Dados Típico

```
[User Interaction]
     ↓
[React Component] → [useAppStore]
     ↓                    ↓
[src/lib/api.ts]   ← invoke(command_name)
     ↓
[src-tauri/src/lib.rs] → comando Rust
     ↓
[db.rs] → SQLite
     ↓
[retorna dados] → atualiza store → re-render
```

---

## 🧩 Padrões e Convenções

- **Tipagem forte:** todos os payloads entre Rust ↔ TS são tipados em `src/lib/api.ts` (interfaces TS) e `src-tauri/src/lib.rs` (structs com `Serialize/Deserialize`).
- **Sem internet obrigatória:** tudo funciona offline. Não adicionar fetch para APIs externas a menos que `cloudSync` flag esteja ativa.
- **Não usar Material UI / Shadcn:** apenas Tailwind + componentes próprios em `src/components/ui/`.
- **Ícones:** Material Symbols Outlined (via CSS class `material-symbols-outlined`).
- **Fonte:** Geist (Google Fonts).
- **Datas:** sempre `YYYY-MM-DD` para `date` e ISO `YYYY-MM-DDTHH:MM:SS` para timestamps.
- **Persistência:** preferir adicionar settings na tabela `settings` (key-value) a criar nova tabela quando possível.

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento (abre janela)
npm run tauri dev

# Build de produção
npm run tauri build

# Apenas frontend (sem janela Tauri)
npm run dev

# Verificar Rust sem build completo
cd src-tauri && cargo check
```

---

## ⚠️ Antes de Alterar

1. Leia a seção relevante deste guia.
2. Identifique o arquivo único a modificar (na maioria dos casos é 1, no máximo 2-3).
3. Após terminar, **atualize este AI_GUIDE.md** se a estrutura/responsabilidades mudaram.
4. **Sempre atualize o [CHANGELOG.md](CHANGELOG.md)** com a nova versão e descrição da mudança.
