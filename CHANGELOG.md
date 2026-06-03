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

### Adicionado
- (próximas mudanças aqui)

---

## [0.1.0] — 2026-06-03

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

[Não publicado]: https://github.com/joaovictorcouto/gole/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/joaovictorcouto/gole/releases/tag/v0.1.0
