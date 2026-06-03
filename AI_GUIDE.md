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
│   ├── components/ui/
│   │   ├── SideNav.tsx          ← Navegação lateral
│   │   ├── WaterGlass.tsx       ← Copo virtual animado
│   │   ├── CircularProgress.tsx ← Anel de progresso SVG
│   │   ├── ReminderToast.tsx    ← Toast de lembrete in-app
│   │   └── Toggle.tsx           ← Switch on/off
│   │
│   └── pages/
│       ├── Dashboard.tsx        ← Tela principal
│       ├── Statistics.tsx       ← Estatísticas (7/30 dias)
│       ├── Achievements.tsx     ← Conquistas
│       ├── Settings.tsx         ← Configurações
│       └── onboarding/
│           ├── Welcome.tsx      ← Tela 1: boas-vindas
│           ├── Weight.tsx       ← Tela 2: peso (slider)
│           ├── Activity.tsx     ← Tela 3: nível de atividade
│           ├── Climate.tsx      ← Tela 4: clima
│           └── Result.tsx       ← Tela 5: meta calculada
│
└── src-tauri/               ← BACKEND (Rust)
    ├── Cargo.toml           ← Dependências Rust
    ├── tauri.conf.json      ← Config Tauri (janela, tray, plugins)
    ├── capabilities/default.json  ← Permissões da janela
    └── src/
        ├── main.rs          ← Entry point (chama gole_lib::run())
        ├── lib.rs           ← TODOS os comandos Tauri + setup tray + scheduler
        ├── db.rs            ← Camada SQLite (settings, logs, reminders, achievements)
        ├── hydration.rs     ← Fórmula de cálculo de meta diária
        └── phrases.rs       ← Banco de frases de notificação + anti-repetição
```

---

## 🎯 Onde Alterar O Quê (Cheat Sheet)

### Cálculo de hidratação (meta diária)
→ **`src-tauri/src/hydration.rs`** — função `calculate_goal()`
- Base: `peso × 35ml`
- Bônus de atividade: sedentary=0, light=300, moderate=600, active=1000
- Bônus de clima: cold=0, temperate=200, hot=500

### Frases das notificações
→ **`src-tauri/src/phrases.rs`** — função `get_phrases()`
- Categorias: `humor`, `geek`, `escritorio`, `motivacional`, `minimalista`
- Sistema anti-repetição mantém últimas 5 frases na memória

### Banco de dados (schema, queries)
→ **`src-tauri/src/db.rs`**
- Tabelas: `settings`, `daily_logs`, `reminders`, `achievements`, `streak_log`
- Para adicionar coluna/tabela: editar `init_db()` (usar `CREATE TABLE IF NOT EXISTS`)

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

### Scheduler de lembretes
→ **`src/App.tsx`** — useEffect que chama `api.sendReminder()` a cada `reminder_interval_min`
- Lembrete é disparado pelo frontend; o Rust apenas registra e emite evento

### Tela de Onboarding
→ **`src/pages/onboarding/*.tsx`** + roteamento em **`src/App.tsx`** (`<OnboardingFlow />`)
- Estado compartilhado entre etapas vive no `OnboardingFlow` (useState local)
- No final, `Result.tsx` chama `completeOnboarding()` do store

### Dashboard (cards, copo, estatísticas)
→ **`src/pages/Dashboard.tsx`**
- Para alterar layout: bento grid `grid-cols-12` com 3 colunas (4+5+3)
- Cards: "Consumido", "Restante", "Registro Rápido", "Streak", "Dica"

### Conquistas
1. Adicionar metadata em **`src/pages/Achievements.tsx`** — objeto `ACHIEVEMENT_META`
2. Adicionar lógica de unlock em **`src-tauri/src/lib.rs`** — função `check_achievements_internal()`
3. Conquistas atuais: `first_day`, `goal_complete`, `streak_7`, `streak_30`, `streak_100`, `liters_100`

### Configurações (Settings)
→ **`src/pages/Settings.tsx`**
- Secções: Perfil/Medidas, Lembretes, Notificações, Sistema
- Salvamento é automático (debounce não necessário pois SQLite é local)

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
