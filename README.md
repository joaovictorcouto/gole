# 💧 GOLE — Rastreador de Hidratação Desktop

O **GOLE** é um aplicativo desktop moderno, minimalista e focado em privacidade, desenvolvido para ajudar você a manter hábitos saudáveis de hidratação. Usando uma arquitetura local e eficiente, ele calcula suas metas de água personalizadas, gerencia seus lembretes e gamifica sua jornada de consumo, tudo diretamente do seu computador.

Desenvolvido com **Tauri v2** + **Rust** no backend e **React** + **Tailwind CSS v4** no frontend, o GOLE funciona de forma 100% offline, salvando seus dados localmente via **SQLite**.

---

## ✨ Funcionalidades Principais

*   **📐 Cálculo Personalizado:** A sua meta diária de hidratação é calculada cientificamente com base no seu **peso corporal**, **nível de atividade física** (sedentário, leve, moderado, ativo) e o **clima** da sua região (frio, equilibrado, quente). Editar peso/idade nas configurações recalcula a meta em tempo real (auto-save).
*   **💧 Registro Rápido com Quantidade Inteligente:** O botão "Beber Água" (no Dashboard, SideNav e tray) sempre usa a quantidade do lembrete (porção típica calculada a partir da meta diária ÷ intervalo). O texto exibe a quantidade em ml e atualiza dinamicamente.
*   **🍶 Recipiente Principal Dinâmico:** Configure o recipiente que você mais utiliza no dia a dia (copo, garrafa pequena, garrafa esportiva ou garrafão) com SVGs interativos.
    *   *Equivalência Visual:* Veja no painel quantas garrafas/copos faltam para atingir a meta diária (ex.: *"ou 4 garrafas de 600ml"*).
    *   *Notificações Contextuais:* As notificações traduzem a meta em ações reais baseadas no seu recipiente (ex.: *"metade da sua garrafa"*, *"1/4 da sua garrafa"*).
*   **🔔 Notificação Customizada Estilizada:** Em vez da notificação nativa do Windows, o GOLE abre uma **janela própria frameless e transparente** no canto inferior direito do monitor, com a identidade visual do app (gradiente azul, glassmorphism, fonte Geist). Inclui frase motivacional, 3 métricas (Beba / Já bebido / Falta) e botões "Já bebi ✓" / "Daqui 5 min". Auto-dismiss em 30s.
*   **🎵 Sons de Alerta Customizáveis:** 5 presets de som gerados via Web Audio API (Gota realista de 3 camadas, Ding, Chime, Suave, Sino) + opção Nenhum. Slider de volume com pré-escuta.
*   **💬 Motor de Frases Inteligente (SQLite):** Sistema persistente de frases para notificações com categorias selecionáveis (Profissional, Equilibrado, Brincalhão, Tudo, Favoritas, Personalizadas). Controle rígido de anti-repetição no SQLite e CRUD completo de frases customizadas.
*   **📅 Lembrete Bimestral de Perfil:** Toast in-app (`UpdateProfileToast`) bimestral (a cada 60 dias) para lembrar você de conferir e atualizar seus dados corporais.
*   **🏆 20 Conquistas com Auto-Unlock:** Streaks (3/7/14/30/100 dias), litros acumulados (10/50/100/500), dias ativos, dias com meta, "goldão" (1L de uma vez), "madrugador", "coruja", "acima da meta", "guerreiro de fim de semana", etc. Desbloqueio automático após cada bebida E ao abrir a tela (retroativo).
*   **⚡ Modo Silencioso (System Tray):** Fechar a janela (`[X]`) apenas a oculta na bandeja. Menu do tray minimalista: Abrir GOLE / Beber água agora (+Xml dinâmico) / Pausar-Retomar lembretes (toggle único) / Sair.
*   **📈 Estatísticas com Períodos Flexíveis:** Gráficos de barras com 4 períodos: 7d / 30d / 90d / Personalizado (com date pickers estilizados em pt-BR). Tooltip ao hover mostra detalhes do dia. **Barras clicáveis** abrem um modal para editar registros daquele dia (adicionar manualmente com horário, editar, excluir). Atualização em tempo real.
*   **✏️ Editar Histórico:** Tanto o Dashboard (clicar no valor consumido de hoje) quanto Estatísticas (clicar numa barra) abrem o histórico do dia escolhido com CRUD completo (com input de horário em registros manuais).
*   **🛟 Suporte e Feedback Integrado:** Modal de suporte (Bug / Sugestão / Outro) com email opcional. Envia via cliente de email padrão (`mailto:`) ou abre uma issue pré-preenchida no GitHub.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma stack robusta, moderna e focada em performance e consumo mínimo de recursos de hardware:

*   **Backend Nativo:** [Rust](https://www.rust-lang.org/) (através do [Tauri v2](https://v2.tauri.app/)) garantindo segurança de memória, arquivos compilados pequenos e inicialização instantânea.
*   **Frontend Web:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) e [Vite](https://vite.dev/).
*   **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com paleta de cores customizada "Luminous Hydration" e efeito glassmorphic.
*   **Banco de Dados:** [SQLite](https://www.sqlite.org/) local integrado diretamente no Rust através da crate `rusqlite` (banco de dados persistido no diretório padrão do sistema operacional do usuário).
*   **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) para controle fluído de estados no React.
*   **Ícones:** Material Symbols Outlined.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

Para rodar e compilar o GOLE na sua máquina, certifique-se de ter instalado:
1.  **Node.js** (versão 18 ou superior) + **npm**.
2.  **Ferramentas de compilação do Rust:** Instale o Rust compiler e o `cargo` usando o [rustup](https://rustup.rs/).
3.  *Para Windows:* Certifique-se de possuir o C++ Build Tools instalado (gerenciado pelo Visual Studio Installer).

### Instalação

1.  Clone o repositório na sua máquina:
    ```bash
    git clone https://github.com/joaovictorcouto/gole.git
    cd gole
    ```

2.  Instale as dependências de pacotes do Node:
    ```bash
    npm install
    ```

### Comandos de Desenvolvimento

*   **Iniciar o aplicativo em modo de desenvolvimento:**
    ```bash
    npm run tauri dev
    ```
    *Este comando inicia o servidor do Vite para o frontend, compila o backend em Rust com debug symbols e abre a janela nativa do aplicativo.*

*   **Testar apenas o frontend no navegador (sem Tauri/Rust APIs):**
    ```bash
    npm run dev
    ```

*   **Verificar a sintaxe e compilação do código Rust (mais rápido que rodar o dev completo):**
    ```bash
    cd src-tauri
    cargo check
    ```

*   **Gerar o instalador final de produção compilado:**
    ```bash
    npm run tauri build
    ```
    *Gera arquivos otimizados e cria o instalador nativo (.msi / .exe no Windows) na pasta `src-tauri/target/release/bundle/`.*

---

## 🗂️ Estrutura do Projeto

A organização de diretórios do projeto segue a arquitetura padrão do Tauri:

```
gole/
├── AI_GUIDE.md              # Referência rápida para modificações rápidas do projeto
├── CHANGELOG.md             # Histórico de alterações e controle de versão
├── README.md                # Este documento de apresentação
├── index.html               # Ponto de entrada del HTML principal
├── package.json             # Dependências NPM e scripts Vite/Tauri
├── vite.config.ts           # Configurações do Vite + plug-in Tailwind v4
│
├── src/                     # FRONTEND (Interface React)
│   ├── main.tsx             # Arquivo inicializador do React
│   ├── App.tsx              # Rotas, fluxo de onboarding e temporizador de lembretes
│   ├── index.css            # Estilos gerais, paleta de cores e animações fluidas
│   ├── lib/
│   │   ├── api.ts           # Camada de comunicação tipada TypeScript ↔ Rust Commands
│   │   └── featureFlags.ts  # Feature flags para ativação/desativação de novas features
│   ├── store/
│   │   └── useAppStore.ts   # Zustand store gerenciando dados e persistência no app
│   ├── components/ui/
│   │   ├── SideNav.tsx              # Barra de navegação lateral
│   │   ├── WaterGlass.tsx           # Copo animado de consumo
│   │   ├── CircularProgress.tsx     # Anel SVG de progresso
│   │   ├── UpdateProfileToast.tsx   # Toast bimestral de revisão de perfil
│   │   ├── Toggle.tsx               # Switch on/off
│   │   ├── Modal.tsx                # Modal genérico reutilizável
│   │   ├── DatePicker.tsx           # Calendário customizado (pt-BR)
│   │   ├── DrinkHistoryModal.tsx    # Edição de registros de qualquer dia
│   │   └── SupportModal.tsx         # Form de bug/sugestão (mailto + GitHub)
│   └── pages/
│       ├── Dashboard.tsx     # Tela inicial com consumo diário e registro rápido
│       ├── Statistics.tsx    # Gráficos 7/30/90/personalizado + tooltip + barras clicáveis
│       ├── Achievements.tsx  # 20 conquistas com auto-unlock retroativo
│       ├── Settings.tsx      # Configurações + gerenciamento de frases + testar notificação
│       ├── ReminderWindow.tsx # UI da notificação customizada (janela própria frameless)
│       └── onboarding/
│           └── Onboarding.tsx # Fluxo unificado de configuração inicial
│
└── src-tauri/               # BACKEND (Código Rust e Configurações Nativas)
    ├── Cargo.toml           # Dependências de crates do Rust
    ├── tauri.conf.json      # Configurações da janela, ícones, bundle e plugins Tauri
    └── src/
        ├── main.rs          # Entrada inicial da aplicação (invoca gole_lib)
        ├── lib.rs           # Handlers do Tauri, menu de bandeja (Tray) e motor de lembretes
        ├── db.rs            # Inicialização e operações do banco de dados SQLite
        └── hydration.rs     # Algoritmo de cálculo de meta diária de hidratação
```

---

## 🔒 Privacidade e offline-first

O GOLE foi concebido sob a filosofia **offline-first**. Nenhum dado pessoal, de saúde ou estatística de consumo é enviado para servidores externos. Tudo é armazenado de forma totalmente encriptada e isolada localmente no seu computador através do banco de dados SQLite (`gole.db`), que reside com segurança na pasta do seu usuário (`App Data`).

---

## 🤝 Contribuições

Contribuições são super bem-vindas! Sinta-se livre para abrir uma **Issue** relatando bugs ou sugerindo novas funcionalidades, ou envie um **Pull Request** seguindo os padrões de código especificados no `AI_GUIDE.md`.

---

## 📝 Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo de licença para mais detalhes.
