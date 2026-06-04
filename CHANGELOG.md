# Changelog

Todas as mudanças relevantes neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

> **REGRA:** toda alteração significativa no projeto DEVE ser registrada aqui antes do commit.
> - **MAJOR** (X.0.0): quebra de compatibilidade, refatoração estrutural grande.
> - **MINOR** (0.X.0): nova feature, sem quebrar nada existente.
> - **PATCH** (0.0.X): correção de bug, ajuste de UI, refatoração interna sem impacto externo.

---

## [Não publicado]

---

## [0.1.0] — 2026-06-04

### Adicionado
- **Sliders interativos de horas no onboarding**: Agora a definição do período ativo no computador é feita por barras deslizantes (sliders) de 30 em 30 minutos, eliminando a digitação obrigatória.
- **Card dedicado de horários**: A tela final do onboarding ganhou um resumo completo com um card próprio mostrando os horários ativos configurados para lembretes.
- **Edição de horário nos registros**: O histórico de consumo (`DrinkHistoryModal`) agora permite editar tanto a quantidade de água (ml) quanto o horário específico de cada copo registrado.
- **Changelog integrado no app**: Adicionado o número da versão (`v0.1.0`) e o botão "O que há de novo?" no rodapé do menu lateral, abrindo um modal descritivo das atualizações.

### Alterado
- **Histórico centralizado e maior**: O gráfico de garrafinhas no histórico de Estatísticas agora fica centralizado (alinhamento simétrico nas laterais) e as garrafas de 30/60 dias aumentaram para 44px de largura (antes 40px) para melhor conforto e precisão de toque.
- **Auto-retomada de lembretes**: Lembretes pausados nas configurações são reativados automaticamente no dia seguinte.
- **Suporte simplificado**: O painel de suporte foi reduzido ao essencial, exibindo informações diretas de contato e botões de ação para abrir email padrão.
- **Nova identidade visual**: Atualização global para tons de azul mais leves e vibrantes (#257ca3 e #0f76a0).

### Corrigido
- **Clique nos Toggles**: Reescrevemos o componente `<Toggle />` utilizando elementos `<div>` e manipuladores diretos de clique, eliminando conflitos de ID duplicado (`undefined`) associados a labels/inputs aninhados que travavam os botões no painel de configurações.

---

## [0.0.9] — 2026-06-03

### Corrigido (segunda iteração)

- **Tooltip do gráfico agora aparece sempre:** Antes o tooltip era um filho absoluto da barra e era cortado por containers com overflow ou ficava atrás do header. Agora o tooltip é renderizado uma única vez no nível do componente Statistics com `position: fixed` seguindo o cursor (`onMouseEnter`/`onMouseMove`/`onMouseLeave`), com `z-index: 9999` e auto-flip pra baixo se não houver espaço acima.
- **Hover das barras minimalista:** Removido o shadow externo "ring" que ficava esquisito em barras finas (parecia uma cápsula sólida). Substituído por:
  - `brightness(1.1)` na barra ao passar o mouse
  - overlay azul-claro sutil sobre o fundo cinza (`linear-gradient` com baixa opacidade) — dá feedback visual sem distorcer a forma
  - Sem outline/borda extra

### Adicionado

- **Date picker estilizado** (`DatePicker.tsx`): substitui o `<input type="date">` nativo do navegador no período Personalizado em Estatísticas. Popover com glassmorphism, navegação por mês com chevrons, grid de dias D-S-T-Q-Q-S-S em pt-BR, destaque do "Hoje" e do dia selecionado, atalho rápido "Hoje", desabilita datas fora dos limites min/max. Mesma identidade visual do app.
- **Tooltip instantâneo nas barras do Histórico:** Ao passar o mouse sobre uma barra, aparece um popover escuro mostrando data, consumo, meta, percentual e dica "Clique para editar". Sem delay (120ms de transição). Aparece acima da barra com seta apontando.

### Alterado

- **Indicador de meta em tempo real:** Tanto a timeline semanal do Dashboard quanto o gráfico de Histórico em Estatísticas agora se atualizam imediatamente ao registrar/editar/excluir uma bebida (dependência adicionada em `drinkTick` no `useEffect`). Antes só recarregava em intervalos ou ao trocar período.
- **Hover não corta mais as barras:** O container do gráfico mudou de `overflow-hidden` para `overflow-x-hidden overflow-y-visible`, com `py-1` extra. O efeito de hover (ring/shadow) agora aparece inteiro nas bordas superior e inferior das barras.

---

## [0.0.8] — 2026-06-03

### Alterado

- **"Beber Água" sempre usa a quantidade do lembrete** (calculada a partir da meta diária / intervalo). Antes, quando o recipiente principal estava configurado, o botão usava a capacidade do recipiente (que pode ser muito maior que um gole normal). Agora Dashboard, SideNav e tray sempre registram a "porção típica de um gole" — a mesma quantidade que aparece na notificação. O texto do tray e a pill do SideNav refletem isso (`+250ml` etc.).
- **Histórico das Estatísticas cabe sempre na tela:** Para 7 dias, mantém labels de data abaixo de cada barra. Para 30/90/personalizado, as barras viram pills finas (gap reduzido) e os labels por barra são substituídos por uma régua: data do primeiro, do meio e do último dia. Container com `overflow-hidden` garante que nunca extravase.

### Adicionado

- **Editar histórico de dias anteriores:** Cada barra do gráfico de Histórico (Estatísticas) é clicável. Abre o `DrinkHistoryModal` para aquele dia — listando registros com horário, permitindo editar quantidade, deletar, ou adicionar registro retroativo. Ao fechar o modal, o gráfico recarrega.
- **Horário em registros manuais:** O modal de "Adicionar registro manual" agora tem um campo `<input type="time">` ao lado da quantidade. Permite registrar bebidas que aconteceram em horários específicos (útil tanto para hoje quanto para dias passados).
- **Modal de Suporte:** Clicar em "Suporte" no SideNav abre um formulário com tipo (Bug / Sugestão / Outro), descrição (textarea) e email opcional. Dois botões: "Enviar por email" (abre mailto: pré-preenchido) e "Abrir como issue no GitHub" (abre a página de criação de issue do repo com title/body prefill).
- **Notificação de lembrete estilizada (janela própria):** Substituímos a notificação nativa do Windows por uma janela Tauri customizada:
  - Frameless, transparente, sempre no topo, fora da taskbar
  - Posicionada no canto inferior direito do monitor principal
  - Identidade visual do app: gradiente azul, blur, sombra suave, fonte Geist, micro-animação de slide
  - Mostra: ícone do app, frase, três métricas (Beba / Já bebido / Falta) com a quantia do recipiente se configurado, dois botões (Já bebi ✓ / Daqui 5 min)
  - Auto-dismiss em 30s
  - A mesma estética do antigo toast in-app — mas agora aparece **fora do app**, em qualquer tela do PC

### Técnico

- Janela criada via `WebviewWindowBuilder` em `setup()`, com label `"reminder"`, hidden por padrão. Capabilities atualizadas para incluir essa janela.
- `main.tsx` detecta `?window=reminder` na URL e renderiza `<ReminderWindow />` em vez de `<App />`.
- `ReminderWindow` escuta o evento `reminder` e usa `getCurrentWindow().hide()` para se ocultar.
- Novos comandos Rust: `get_drinks_for_date(date)`, `log_drink_at(amount_ml, logged_at)`.
- Plugin `@tauri-apps/plugin-opener` usado para abrir mailto: e https://github.com no email/navegador padrão.

---

## [0.0.7] — 2026-06-03

### Alterado

- **Quantidade visível nos botões "Beber Água":**
  - SideNav agora mostra a quantidade como pill: `Beber Água  +500ml` (usa capacidade do recipiente se configurado; senão `suggested_per_reminder`).
  - Menu do tray agora mostra `💧 Beber água agora (+500ml)`. O texto se atualiza automaticamente quando o usuário altera o recipiente nas Configurações.
- **Timeline da semana no Dashboard:** Os 7 círculos abaixo do streak agora representam a **semana de calendário atual** (Domingo–Sábado), não os últimos 7 dias. Apenas dias em que a meta foi efetivamente atingida ficam em **azul escuro**; dias passados sem meta cumprida e dias futuros ficam em cinza. O dia de hoje recebe um anel de destaque. Atualiza em tempo real quando você bate a meta.

### Técnico

- `AppState` ganhou `tray_drink_item: Mutex<Option<MenuItem<Wry>>>` para permitir update reativo do texto do tray.
- Nova função `refresh_tray_drink_label(&AppHandle)` chamada após `save_settings` e `complete_onboarding`.

---

## [0.0.6] — 2026-06-03

### Alterado

- **Notificações 100% no SO (sem toast in-app):** O `ReminderToast` foi removido. O lembrete agora aparece apenas como notificação nativa do sistema operacional (com o ícone do app embutido no executável). O som continua tocando dentro do app quando o evento chega. Título da notificação atualizado para "💧 GOLE — Hora de hidratar".
- **Perfil e Medidas mais compacto:** Peso e Idade agora ficam lado a lado (grid 2 colunas). Atividade em grid 2×2 em vez de lista vertical. O botão "Salvar alterações" foi removido — peso e idade auto-salvam ao sair do campo (`blur`) ou ao pressionar Enter. A meta diária é recalculada imediatamente. Indicador "✓" pisca ao salvar.

### Adicionado — Conquistas

Adicionadas 14 novas conquistas (20 no total agora). Todas são verificadas automaticamente após cada registro de bebida **e também** ao abrir a tela de Conquistas (retroativo), então quem já tinha histórico vai ver várias desbloqueando de uma vez:

- **Streaks adicionais:** `streak_3` (3 dias), `streak_14` (14 dias)
- **Litros:** `liters_10`, `liters_50`, `liters_500`
- **Dias ativos:** `active_7` (7 dias usando o app), `active_30` (30 dias)
- **Dias com meta cumprida (não consecutivos):** `goal_10_days`, `goal_50_days`
- **Comportamento:** `big_gulp` (registro ≥ 1L), `early_bird` (bebeu antes das 7h), `night_owl` (bebeu depois das 22h), `overflow_day` (≥ 120% da meta em um dia), `weekend_warrior` (cumpriu meta sábado + domingo da mesma semana)

Novos helpers no Rust: `has_drink_before_hour`, `has_drink_after_hour`, `max_single_drink`, `distinct_days_with_logs`, `days_goal_reached_count`, `weekend_warrior`, `has_overflow_day`.

---

## [0.0.5] — 2026-06-03

### Adicionado

- **Editar registros do dia:** Novo modal "Registros de hoje" acessível clicando no valor "Consumido" (ou no ícone de edição que aparece no hover) do Dashboard. Permite ver lista cronológica de todos os registros do dia, editar quantidades, excluir registros individuais e adicionar registro manual com quantidade customizada.
- **Botão "Testar notificação"** na seção Lembretes das Configurações: envia um lembrete imediato para validar som e visual.
- **Períodos personalizados nas Estatísticas:** Botões 7 dias / 30 dias / 90 dias / Personalizado. No modo Personalizado, dois date pickers (de–até) permitem visualizar qualquer intervalo histórico. Backend recebeu novo comando `get_range_stats` que preenche dias sem registro com 0 ml.
- **Salvar perfil explícito:** Peso e idade agora têm um botão "Salvar alterações" (com prévia da nova meta diária). Enter no input também salva.

### Alterado

- **Som de Gota mais realista:** Três osciladores em camadas — um "plop" agudo com queda rápida de pitch, uma harmônica de corpo, e um "tick" sutil de gota secundária. Soa muito mais como uma gota d'água caindo.
- **Reorganização das Configurações:** A seção "Sistema" foi movida da coluna direita para a coluna esquerda (abaixo de "Lembretes"), deixando o layout mais equilibrado.

---

## [0.0.4] — 2026-06-03

### Adicionado

- **Desfazer último registro:** Toast flutuante com botão "Desfazer" (5 segundos) após clicar em "Beber Água" no Dashboard.
- **Som dos Lembretes:** Nova seção nas Configurações com 5 presets de som (Gota, Ding, Chime, Suave, Sino) + opção Nenhum. Slider de volume com pré-visualização ao soltar. Sons gerados via Web Audio API (clean, soft, sem arquivos externos). Som toca automaticamente ao aparecer o ReminderToast.
- **Smart Mode "Em breve":** Badge visual indica que o toggle ainda não tem efeito prático.
- **Recalcular lembretes ao beber:** Sempre que o usuário registra uma bebida (botão do Dashboard, undo, tray "Beber água agora", ou confirmação de lembrete), o timer do próximo lembrete é reiniciado do zero — não faz sentido enviar um lembrete logo após beber.

### Alterado

- **Versionamento simplificado:** Padrão agora é `0.0.X` (apenas patch incrementa). Versões anteriores renomeadas: 0.1.0 → 0.0.1, 0.2.0 → 0.0.2, 0.3.0 → 0.0.3.
- **Ícone do app:** Novo ícone com gradiente azul rico (#7DD8F8 → #2A8EC9 → #0A4A7A), sem stroke, com realce sutil. Todos os arquivos regenerados via `tauri icon`. **Nota:** o Windows e o app em execução podem manter o ícone antigo em cache até reiniciar.
- **Janela não redimensionável:** `resizable: false` no tauri.conf.json.
- **Títulos de página fixos:** Dashboard, Estatísticas, Conquistas e Configurações agora têm título fixo no topo; somente o conteúdo abaixo rola.
- **Aba de frases sem overflow:** A caixa de frases usa altura calculada (`max-h: calc(100vh - 220px)`) e a lista rola internamente — nunca ultrapassa a janela.
- **Cursor pointer global:** Regra CSS global para `button`, `[role="button"]`, `a`, `input[range]`.
- **Menu do tray simplificado e unificado:** Apenas: Abrir GOLE / separador / Beber água agora + Pausar/Retomar (um único item que alterna o texto conforme o estado) / separador / Sair. "Beber água agora" usa a capacidade do recipiente configurado.

---

## [0.0.3] — 2026-06-03

### Adicionado

- **Sistema de Frases e Notificações:**
  - Nova tabela `phrases` no SQLite para gerenciar frases padrões e personalizadas de forma persistente.
  - Regra anti-repetição rigorosa baseada em banco de dados: as frases não se repetem até que todo o pool da categoria ativa seja exibido.
  - Aba de gerenciamento de frases nas Configurações contendo favoritar/desfavoritar e CRUD completo para frases personalizadas.
  - Novas personalidades/categorias de frases: Profissional, Equilibrado, Brincalhão, Tudo, Favoritas e Personalizadas.
- **Recipiente Principal (Opcional):**
  - Nova etapa opcional no onboarding para configurar um recipiente principal (copo, garrafa pequena/média/grande/esportiva, garrafão).
  - Feedback visual interativo com ilustrações SVG dinâmicas na tela de configuração.
  - Exibição da meta diária no Dashboard convertida em número de garrafas/recipientes (ex.: `ou 5 garrafas de 700ml`).
  - Tradução de ml em referências intuitivas/porcentagem do recipiente nas notificações (ex.: `cerca de 1/4 da sua garrafa`, `metade da sua garrafa`, `2 dedos de água`).
- **Atualização Bimestral:**
  - Lembrete de verificação cadastral bimestral (`UpdateProfileToast`) que surge no canto inferior direito do app a cada 60 dias para perguntar se o usuário deseja atualizar suas medidas (idade, peso, atividade, clima).
- **Dados do Perfil:**
  - Novo campo de Idade (12-100 anos) adicionado ao onboarding e configurações.

### Alterado

- **Duas Casas Decimais para Água:**
  - Toda a formatação de volumes em litros agora exibe duas casas decimais com vírgula (ex.: `2,25 L`).
- **Edição Inline no Onboarding:**
  - A tela de resultados do onboarding agora possui um formulário de edição rápida de dados (peso, idade, atividade, clima e recipiente), permitindo recalcular a meta instantaneamente.
- **Estatísticas Aprimoradas nas Notificações:**
  - As notificações nativas e o toast in-app (`ReminderToast`) agora exibem informações úteis e minimalistas: quantidade sugerida a beber, quanto já foi bebido e quanto falta.

## [0.0.2] — 2026-06-03

### Alterado — Onboarding redesenhado para identidade visual unificada

- **Onboarding consolidado em arquivo único** (`src/pages/onboarding/Onboarding.tsx`)
  - Removidos os 5 arquivos antigos (`Welcome.tsx`, `Weight.tsx`, `Activity.tsx`, `Climate.tsx`, `Result.tsx`)
  - Estado gerenciado internamente via `useState`, evitando problemas de propagação entre rotas
- **Fluxo simplificado para 3 passos** (em vez de 4):
  1. Peso
  2. Atividade Física
  3. Clima
  - Welcome continua existindo, mas como step 0 (sem indicador), seguido dos 3 passos numerados
- **Identidade visual unificada em todas as telas:**
  - Mesmo header (logo "GOLE" + step indicator)
  - Mesmas blobs ambientais de fundo
  - Mesmo padrão de tipografia (display-lg + body-lg)
  - Mesmo footer com botão "Voltar" + "Próximo"
- **Removido botão "Pular"** da tela de peso (forçava pular onboarding sem responder)
- **Step indicator unificado:** pill mostrando "Passo X de 3" + 3 dots no topo direito (o dot ativo é mais largo)

### Adicionado

- **Clamp de peso (40–150kg)** tanto no slider de onboarding quanto no input das Configurações
  - Função utilitária `clampWeight()` garante que valores fora do intervalo sejam ajustados
  - Texto de orientação abaixo do slider
- **Botão "Ajustar respostas"** na tela de resultado, para voltar ao último passo antes de finalizar
- **Estado de loading** no botão "Começar" (evita double-click e mostra "Salvando...")

### Corrigido

- **Botão "Começar" no Result agora funciona corretamente:**
  - Estado de onboarding (`weight`, `activity`, `climate`) agora vive em um único componente, eliminando o bug onde os valores se perdiam entre rotas
  - Meta diária recalculada via `useEffect` sempre que peso/atividade/clima mudam
  - Navegação usa `replace: true` para evitar voltar ao onboarding via histórico

### Comportamento do app

- **Janela esconde em vez de fechar:** ao clicar no [X], o app vai para o system tray
  - Lembretes continuam funcionando em segundo plano com baixo consumo de RAM
  - Para encerrar de fato: usar item "Sair" do menu do tray
  - Implementado via `WindowEvent::CloseRequested` no Rust com `api.prevent_close()`

### Arquivos afetados

- `src/pages/onboarding/Onboarding.tsx` *(novo)*
- `src/pages/onboarding/{Welcome,Weight,Activity,Climate,Result}.tsx` *(removidos)*
- `src/App.tsx` *(roteamento simplificado)*
- `src/pages/Settings.tsx` *(clamp no input de peso)*
- `src-tauri/src/lib.rs` *(handler `on_window_event` para esconder janela)*
- `AI_GUIDE.md` *(estrutura e cheat sheet atualizados)*

---

## [0.0.1] — 2026-06-03

### 🎉 Lançamento inicial

Primeira versão funcional do GOLE — app desktop de hidratação.

### Adicionado

**Arquitetura**
- Projeto Tauri v2 + React + TypeScript + Tailwind CSS v4 + SQLite
- Estrutura modular (UI, Notifications, Scheduler, Storage, Statistics, HydrationCalculator, SmartMode, Achievements, SystemTray, FeatureFlags)
- Sistema de Feature Flags centralizado em `src/lib/featureFlags.ts`
- Persistência SQLite local via `rusqlite` (offline-first, sem dependência de servidor)
- Camada de API tipada entre Rust e TypeScript

**Onboarding (5 telas)**
- Tela 1: Boas-vindas com logo e CTA "Começar"
- Tela 2: Peso corporal (slider de 40kg a 150kg)
- Tela 3: Nível de atividade física (4 opções: sedentário, leve, moderado, ativo)
- Tela 4: Clima (3 opções: frio, temperado, quente)
- Tela 5: Resultado com meta diária calculada

**Cálculo de Hidratação**
- Fórmula base: `peso × 35ml`
- Ajustes de atividade: +0ml, +300ml, +600ml, +1000ml
- Ajustes de clima: +0ml, +200ml, +500ml

**Dashboard Principal**
- Card "Consumido" com progresso circular animado
- Card "Restante" com cálculo dinâmico
- Botão "Registro Rápido" para beber a quantidade sugerida
- Copo virtual animado (preenche conforme progresso diário)
- Card de Streak (sequência) com timeline da semana
- Card de Dica de Hidratação

**Sistema de Lembretes**
- 5 intervalos configuráveis: 30min, 45min, 1h, 1h30, 2h
- Cálculo automático da quantidade sugerida por lembrete
- Toast in-app com botões "Já bebi" e "Daqui 5 min"
- Notificação nativa do sistema operacional
- Banco de 25 frases em 5 categorias (Humor, Geek, Escritório, Motivacional, Minimalista)
- Sistema anti-repetição (últimas 5 frases não se repetem)
- Personalidade configurável (Misturado é padrão)

**Estatísticas**
- Resumo de hoje (Meta, Consumido, Restante, Progresso)
- Gráfico de barras dos últimos 7 dias
- Gráfico de barras dos últimos 30 dias
- Média diária e dias com meta atingida

**Conquistas (6 marcos)**
- 🌱 Primeiro Dia — primeiro registro
- 🏆 Meta Completa — primeira meta diária atingida
- 🔥 7 Dias Seguidos
- 💎 30 Dias Seguidos
- 🚀 100 Dias Seguidos
- 🌊 100 Litros consumidos

**System Tray**
- Abrir aplicativo
- Pausar lembretes
- Retomar lembretes
- Sair

**Configurações**
- Perfil e Medidas (peso, atividade, clima)
- Lembretes (intervalo, pausa)
- Personalidade das notificações
- Sistema (autostart, smart mode)

**Design System "Luminous Hydration"**
- Paleta de azuis hidratados (primary `#3b6377`, secondary `#0d658c`)
- Fundo cool-white `#f7f9fc`
- Tipografia Geist
- Cards com glassmorphism + sombras suaves
- Animações fluidas (water fill, ripple, slide-in)

**Feature Flags iniciais**
- ✅ Ativas: `smartMode`, `achievements`, `statistics`
- 🔒 Reservadas para futuro: `cloudSync`, `mobileCompanion`, `smartWatch`, `aiSuggestions`, `adaptiveHydration`, `customThemes`

### Infraestrutura
- Repositório público criado: https://github.com/joaovictorcouto/gole
- Commit de checkpoint inicial: `7236d8b — checkpoint-before-development`
- Commit da implementação: `c48972e — feat: implement GOLE hydration tracker desktop app`

---

[Não publicado]: https://github.com/joaovictorcouto/gole/compare/v0.0.4...HEAD
[0.0.4]: https://github.com/joaovictorcouto/gole/releases/tag/v0.0.4
[0.0.3]: https://github.com/joaovictorcouto/gole/releases/tag/v0.0.3
[0.0.2]: https://github.com/joaovictorcouto/gole/releases/tag/v0.0.2
[0.0.1]: https://github.com/joaovictorcouto/gole/releases/tag/v0.0.1
