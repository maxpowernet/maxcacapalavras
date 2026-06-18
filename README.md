# 🎮 Max - Jogos Interativos

> Plataforma educacional gamificada para instrutores e turmas técnicas  
> Desenvolvido para uso em telas interativas LG · SENAI CT Gurupi

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias](#tecnologias)
3. [Instalação e Execução](#instalação-e-execução)
4. [Arquitetura do Projeto](#arquitetura-do-projeto)
5. [Modos de Jogo](#modos-de-jogo)
6. [Fluxo da Aplicação](#fluxo-da-aplicação)
7. [Formato das Perguntas](#formato-das-perguntas)
8. [Sistema de Temas](#sistema-de-temas)
9. [Persistência de Dados](#persistência-de-dados)
10. [Funcionalidades Extras](#funcionalidades-extras)
11. [Painel do Instrutor — Interface](#painel-do-instrutor--interface)
12. [Bugs Corrigidos](#bugs-corrigidos)

---

## Visão Geral

**Max - Jogos Interativos** (anteriormente "Max Caça Palavras") é uma plataforma web educacional multiplayer que transforma material didático (PDF ou TXT) em jogos interativos de perguntas e respostas. Projetada para **telas interativas LG**, permite que instrutores do SENAI conduzam dinâmicas competitivas em sala de aula.

> O Caça-Palavras continua sendo o modo de jogo principal e o que originou o nome histórico do projeto, mas a marca foi atualizada para **"Max - Jogos Interativos"** para refletir os 7 modos de jogo disponíveis na plataforma (veja [Modos de Jogo](#modos-de-jogo)).

### Destaques
- Upload de material didático (PDF/TXT) com extração automática de perguntas
- **7 modos de jogo** usando o mesmo banco de perguntas
- Até **4 equipes** competindo simultaneamente
- Histórico de resultados por turma e por jogo
- Exportação de relatórios em PDF
- Temas claro e escuro
- Funciona 100% no navegador, sem instalação de servidor

---

## Tecnologias

| Camada | Tecnologia | Versão |
|---|---|---|
| **UI** | React | 19.2 |
| **Build** | Vite | 8.0 |
| **Parser PDF** | pdfjs-dist | 6.0 |
| **IDs únicos** | uuid | 14.0 |
| **Lint** | ESLint + eslint-plugin-react-hooks | 10.3 |
| **JSX Transform** | @vitejs/plugin-react (Oxc) | 6.0 |

> **Nota:** A aplicação é 100% client-side. Não há backend — todos os dados são persistidos em `localStorage`.

---

## Instalação e Execução

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd maxcacapalavras

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
# → Acesse http://localhost:5173

# Build para produção
npm run build

# Lint
npm run lint
```

### Requisitos
- Node.js 18+
- npm 9+

---

## Arquitetura do Projeto

```
src/
├── main.jsx                    # Entry point + ErrorBoundary global
├── App.jsx                     # Roteamento principal entre telas
├── App.css                     # Estilos específicos do App
├── index.css                   # CSS global (temas, glass morphism, animações)
│
├── context/
│   └── AppContext.jsx          # Estado global (turmas, jogos, perguntas, histórico)
│
├── hooks/
│   ├── useGame.js              # Lógica central do jogo (estado, turnos, pontuação)
│   ├── useAuth.js              # Autenticação local
│   ├── useClasses.js           # CRUD de turmas
│   ├── useGames.js             # CRUD de jogos
│   ├── useQuestions.js         # CRUD de perguntas
│   ├── useHistory.js           # Histórico de partidas
│   ├── useBadges.js            # Sistema de conquistas
│   ├── useSound.js             # Efeitos sonoros (Web Audio API)
│   └── useTheme.js             # Alternância de tema claro/escuro
│
├── screens/
│   ├── AuthScreen.jsx          # Login e cadastro
│   ├── InstructorDashboard.jsx # Painel principal do instrutor
│   ├── TeamSetupScreen.jsx     # Configuração de equipes antes do jogo
│   ├── GameScreen.jsx          # Roteador de modos de jogo + WordGridWrapper
│   ├── VictoryScreen.jsx       # Tela de vitória com ranking
│   ├── dashboard/
│   │   ├── DashboardView.jsx   # Aba "Dashboard" (estatísticas)
│   │   ├── ClassesView.jsx     # Aba "Turmas"
│   │   ├── GamesView.jsx       # Aba "Jogos"
│   │   └── HistoryView.jsx     # Aba "Histórico"
│   └── game-modes/
│       ├── GameLayout.jsx      # Layout compartilhado (sidebar + placar)
│       ├── QuizTempoScreen.jsx # Modo Quiz por Tempo
│       ├── ForcaScreen.jsx     # Modo Forca em Equipe
│       ├── EliminacaoScreen.jsx# Modo Eliminação (estilo Milionário)
│       ├── CorridaScreen.jsx   # Modo Corrida do Conhecimento
│       ├── BombaScreen.jsx     # Modo Bomba Relógio
│       └── DueloScreen.jsx     # Modo Duelo
│
├── components/
│   ├── WordGrid.jsx            # Grid 14×14 do caça-palavras (toque/arrasto)
│   ├── TimerDisplay.jsx        # Countdown com alerta visual
│   ├── QuizOverlay.jsx         # Overlay de pergunta + alternativas
│   ├── HangmanDisplay.jsx      # Canvas do boneco da forca
│   ├── BoardGame.jsx           # Tabuleiro digital (serpentina)
│   ├── Scoreboard.jsx          # Placar lateral em tempo real
│   ├── PlayerCard.jsx          # Card de equipe com pontuação
│   ├── PauseOverlay.jsx        # Tela de pausa
│   ├── BrandLogo.jsx           # Logo do projeto
│   ├── BadgesPanel.jsx         # Painel de conquistas
│   ├── FileUploader.jsx        # Upload drag-and-drop de PDF/TXT
│   ├── QuestionManager.jsx     # Gerenciador visual de perguntas
│   ├── QuestionTextParser.jsx  # Editor de perguntas por texto
│   ├── PrintReport.jsx         # Geração de relatório PDF
│   └── charts/
│       └── BarChart.jsx        # Gráfico de barras para estatísticas
│
└── utils/
    ├── parseFile.js            # Parser de PDF e TXT para extração de perguntas
    ├── wordGrid.js             # Gerador de grid e validação de seleção
    ├── storage.js              # Wrapper de localStorage com prefixo mcp_
    └── hash.js                 # Utilitário de hash
```

### Padrões Arquiteturais

- **Context API** para estado global (`AppContext`) — sem Redux/Zustand
- **Custom Hooks** para separar lógica de negócio da UI
- **useRef pattern** para estabilizar callbacks em effects (evita stale closures)
- **`key` prop** para forçar remontagem quando dependências mudam
- **ErrorBoundary** (class component) no `main.jsx` para recuperação de crashes
- **CSS Custom Properties** para sistema de temas (`var(--text)`, `var(--panel)`, etc.)

---

## Modos de Jogo

Todos os 7 modos utilizam o **mesmo banco de perguntas**. O instrutor escolhe o modo antes de iniciar a partida.

### 1. Caça-Palavras (Modo Principal)

**Fases:** `quiz` → `wordsearch` → `turn_transition`

- **Fase 1 — Quiz:** Pergunta de múltipla escolha para a equipe da vez
- **Fase 2 — Caça-Palavras:** Grid 14×14 gerado dinamicamente com a palavra-chave escondida
  - Seleção por toque/clique e arrasto (horizontal, vertical ou diagonal)
  - 30 segundos para encontrar a palavra
- **Pontuação:** Encontrou em até 15s → 10 pts | 15–30s → 5 pts | Erro/tempo → 0 pts

### 2. Quiz por Tempo

**Fases:** `question` → `answering` (→ volta para `question`)

- Todas as equipes respondem simultaneamente via **buzzer**
- A primeira equipe a buzinar tenta responder
- Se errar, as demais equipes podem buzinar
- Se ninguém acertar, a resposta é revelada

### 3. Forca em Equipe

**Fases:** `quiz` → `forca` → `turn_transition`

- A equipe responde a pergunta para desbloquear a forca
- Teclado virtual na tela para adivinhar letras da palavra-chave
- 6 erros = boneco completo = 0 pontos
- **Pontuação:** 0–2 erros → 15 pts | 3–4 erros → 10 pts | 5 erros → 5 pts

### 4. Eliminação (Estilo Milionário)

**Fases:** `quiz` → `reveal` → `quiz` (ou `eliminated`)

- Uma equipe por vez, 5 perguntas em sequência com dificuldade crescente
- Pontuação crescente: 2 → 5 → 10 → 20 → 40 pontos
- **Ajudas:** 50/50 (elimina 2 erradas), Pular, Consultar equipe
- Errou = perde tudo da rodada

### 5. Corrida do Conhecimento (Tabuleiro Digital)

**Fases:** `quiz` → `special_event` → `quiz`

- Tabuleiro serpentina com 30 casas
- Acerto avança conforme velocidade: rápida → 3 casas, normal → 2, lenta → 1
- **Casas especiais:** ⭐ Estrela (+2 extras), 💣 Armadilha (-2 casas), 🔄 Desafio Bônus, 🛑 Pare
- Vitória: primeira equipe a chegar na casa 30

### 6. Bomba Relógio

**Fases:** `question` → `explosion` → `question`

- "Bomba" virtual com countdown aleatório (oculto)
- A equipe com a bomba responde para passá-la adiante
- Errou = bomba continua com a equipe
- Quando explode: equipe perde pontos (-5 pts)

### 7. Duelo

**Fases:** `waiting_buzz` → `answering` → `steal` → `waiting_buzz`

- Confronto direto entre equipes
- Mesma pergunta exibida para todas
- Primeira a buzinar tenta responder: acertou → +10 pts, errou → -5 pts
- Equipe adversária pode "roubar" respondendo corretamente

---

## Fluxo da Aplicação

```
[Tela de Login/Cadastro]
    ↓
[Dashboard do Instrutor]
    ├── [Turmas] → Criar / Editar turmas
    ├── [Jogos]
    │       ├── Criar Jogo → Upload PDF/TXT → Preview → Salvar
    │       ├── Editar perguntas do jogo
    │       └── ▶ Jogar Agora
    │               ↓
    │       [Configurar Partida]
    │           → Selecionar modo de jogo
    │           → Configurar equipes (2–4)
    │           → Definir pontuação alvo e tempo
    │               ↓
    │       [Jogo em Execução]
    │           → Turnos conforme modo escolhido
    │           → Placar em tempo real (sidebar)
    │           → Modo pausa (clique no logo)
    │               ↓
    │       [Tela de Vitória]
    │           → Ranking final + confetti
    │           → Salvar no histórico
    │           → Jogar novamente ou voltar
    └── [Histórico]
            → Ver partidas anteriores
            → Exportar relatório PDF
            → Estatísticas por turma
```

---

## Formato das Perguntas

O sistema aceita upload de arquivos **PDF** ou **TXT** com o seguinte padrão:

```
Pergunta: Qual é a linguagem de marcação da web?
A) Python
B) HTML
C) Java
D) C++
Correta: B
Palavra: HTML

Pergunta: O que significa CSS?
A) Computer Style Sheets
B) Creative Style Sheets
C) Cascading Style Sheets
D) Colorful Style Sheets
Correta: C
Palavra: CSS
```

### Campos obrigatórios por questão:
| Campo | Descrição |
|---|---|
| `Pergunta:` | Enunciado da questão |
| `A)` a `D)` | Quatro alternativas |
| `Correta:` | Letra da alternativa correta (A, B, C ou D) |
| `Palavra:` | Palavra-chave usada no caça-palavras e na forca |

Também é possível adicionar/editar perguntas manualmente pelo editor de texto integrado.

---

## Sistema de Temas

A aplicação possui dois temas com troca instantânea:

| Tema | Classe CSS | Descrição |
|---|---|---|
| **Dark Neon** (padrão) | — | Fundo escuro com acentos em ciano/neon |
| **Light Clean** | `body.light-theme` | Fundo claro com cores suaves |

### Variáveis CSS principais:
```css
--bg         /* Fundo principal */
--panel      /* Fundo de painéis */
--panel-b    /* Borda/fundo secundário de painéis */
--text       /* Cor do texto principal */
--muted      /* Texto secundário/desabilitado */
--t1         /* Cor de destaque primária (ciano) */
--danger     /* Cor de erro/perigo */
```

Todos os componentes de jogo (WordGrid, TimerDisplay, HangmanDisplay, BoardGame) utilizam essas variáveis para funcionar corretamente em ambos os temas.

---

## Persistência de Dados

Todos os dados são armazenados em `localStorage` com prefixo `mcp_`:

| Chave | Conteúdo |
|---|---|
| `mcp_user` | Dados do usuário logado |
| `mcp_classes` | Lista de turmas |
| `mcp_games` | Lista de jogos com perguntas |
| `mcp_questions` | Perguntas da partida atual |
| `mcp_history` | Histórico de partidas |
| `mcp_game_state` | Estado do jogo em andamento |
| `mcp_theme` | Tema selecionado (dark/light) |

O sistema detecta automaticamente estados de jogo obsoletos (ex: perguntas removidas após salvar) e reseta para `idle` ao recarregar a página.

---

## Funcionalidades Extras

- **Efeitos sonoros** — Web Audio API com beeps de acerto/erro (sem arquivos de áudio)
- **Modo pausa** — Clique no logo durante o jogo para pausar/retomar
- **Relatório PDF** — Exportação de resultados da partida para impressão
- **Badges/Conquistas** — Sistema de conquistas por turma ao longo do semestre
- **Gráficos** — Estatísticas de desempenho no Dashboard
- **Embaralhamento** — Perguntas embaralhadas a cada partida, sem repetição até esgotar o banco
- **Cores das equipes** — Ciano (#00F2FF), Rosa (#FF007A), Verde (#39FF14), Âmbar (#FFBD33)

---

## Painel do Instrutor — Interface

O painel do instrutor (`InstructorDashboard.jsx`) passou por um redesign visual completo, com identidade consistente entre todas as abas: bordas coloridas à esquerda nos cards, sombras suaves na cor de destaque, e títulos com efeito gradiente.

### Logo (BrandLogo.jsx)

O logo foi reformulado de **"MAX CAÇA / PALAVRAS"** para:

```
MAX - JOGOS
INTERATIVOS
```

- Letras em blocos coloridos (ciclando entre `--t1`, `--t2`, `--t3`, `--t4`), mantendo o estilo de "letras-bloco" do logo original
- "MAX" permanece em destaque (blocos brancos/`#F0F8FF`), com o "-" em estilo neutro (sem fundo)
- Tamanho aumentado (de 18px para 21px por bloco no modo `small`) e centralizado no topo do menu lateral

### Títulos com Gradiente (`.gradient-title`)

Nova classe utilitária em `index.css`, aplicada aos títulos principais de cada aba (**Visão Geral**, **Minhas Turmas**, **Meus Jogos**, **Histórico de Partidas**):

```css
.gradient-title {
  background: linear-gradient(135deg, var(--t1) 0%, var(--t2) 50%, var(--t4) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
```

Mantém a fonte e o tamanho originais do `<h1>`, aplicando apenas o efeito de cor.

### Menu Lateral (Sidebar)

- Fundo com degradê de cinza mais claro (`var(--panel-b)` → `var(--panel)`), substituindo o gradiente escuro/azulado anterior
- Itens de navegação reformulados: cada ícone (📊 👥 🕹️ 🏆) agora fica dentro de um "badge" quadrado arredondado que ganha a cor do item e brilho (`box-shadow`) quando ativo
- O item ativo exibe uma barra colorida vertical na borda esquerda (substituindo o antigo indicador em formato de bolinha) e fundo em gradiente sutil na cor do item

### Card de Perfil / Login

O rodapé da sidebar (antes apenas texto com nome, e-mail e botão de logout) virou um **card flutuante**:
- Bordas arredondadas (`border-radius: 20px`), fundo "glass" com `backdrop-filter: blur`, e sombra
- Avatar circular com iniciais do usuário + nome + e-mail
- Botão único **"✖ Sair"** em formato de pílula (o alternador de tema claro/escuro foi removido daqui, pois já está disponível na barra flutuante superior)

### Aba "Visão Geral" (DashboardView.jsx)

- **Cards de estatísticas** (Turmas, Jogos, Partidas, Tempo Total): ícone pequeno no canto superior esquerdo, número em destaque à direita, borda colorida apenas na lateral esquerda
- **Modos Mais Jogados** e **Pontuação Máx. por Turma**: cards mais compactos, lado a lado, com borda colorida à esquerda
- **Partidas por Mês**: card de largura total e mais alto; o `BarChart` ganhou uma prop `height` que reserva espaço para rótulos/valores, corrigindo o overflow do gráfico para fora do card
- **Últimas Partidas**: cada item agora exibe um ícone do modo de jogo utilizado (🔍 ⚡ 🔤 🧩 🏃 💣 ⚔️) ao lado do nome do jogo

### Aba "Minhas Turmas" (ClassesView.jsx)

- Cada card de turma recebeu borda colorida à esquerda (cores alternadas por turma) e sombra sutil na mesma cor
- Ícone 🎓 em destaque ao lado do nome da turma
- **Conquistas**: layout original mantido — apenas as conquistas já validadas (earned) recebem cores alternadas (ciano, rosa, verde, âmbar, etc.) em vez de sempre dourado; as não conquistadas permanecem em cinza/grayscale

### Aba "Histórico de Partidas" (HistoryView.jsx)

- **Cards de resumo** no topo: total de partidas registradas, tempo total jogado e maior pontuação já alcançada
- Cada card de partida ganhou borda colorida à esquerda (cor por modo de jogo) e ícone do modo em destaque
- **Ranking final**: medalhas 🥇🥈🥉 para os 3 primeiros colocados, em vez de "#1, #2, #3"
- Estado vazio com ícone 📭 e botão "Limpar Histórico" só aparece quando há registros

### Caça-Palavras — Cor da Palavra-Alvo

No painel "Encontre a palavra" (exibido durante a fase `wordsearch`), a cor do texto da palavra-chave foi corrigida para `var(--text)`, garantindo contraste correto tanto no tema escuro (texto branco) quanto no tema claro (texto preto), sobre o fundo "glass" do card.

---

## Bugs Corrigidos

### Sessão 1 — Correções de Base

| Bug | Descrição | Arquivo |
|---|---|---|
| **Closure desatualizada no startGame** | `startGame` usava `questions` da closure vazia; agora recebe como parâmetro | `useGame.js`, `App.jsx` |
| **Pool de perguntas com closure stale** | `_nextPool` dependia de `questions` externo; agora usa `allQuestionIds` do próprio gameState | `useGame.js` |
| **Timer resetava a cada hover** | `onTimeout` recriado a cada render; corrigido com `useRef` | `TimerDisplay.jsx` |
| **Renomeação de hook falso** | `useLifeline` chamado em callback de botão; renomeado para `activateLifeline` | `useGame.js`, `EliminacaoScreen.jsx` |
| **Duplo nextTurn** | Erro de seleção + timeout simultâneos; protegido com `completedRef` | `GameScreen.jsx` |
| **setState em useEffect** | Reset de estado via effect; substituído por remontagem com `key` prop | Vários game-modes |
| **Variável sobrescrita** | `let text = ''` nunca usada no parseFile; limpa | `parseFile.js` |
| **ESLint** | 48 erros → 0 erros, 3 warnings restantes (exhaustive-deps pré-existentes) | — |

### Sessão 2 — Correções de Runtime e Tema

| Bug | Descrição | Arquivo |
|---|---|---|
| **Tela em branco ao iniciar jogo** | 3 causas: throw não tratado, estado stale no localStorage, `null` silencioso | `App.jsx`, `AppContext.jsx`, `GameScreen.jsx` |
| **Letras invisíveis no caça-palavras** | Cores hardcoded em branco; substituídas por `var(--text)` e `var(--panel-b)` | `WordGrid.jsx` |
| **Bomba Relógio: tela em branco** | `startGame` definia `phase: 'quiz'` mas BombaScreen espera `'question'` | `useGame.js` |
| **Eliminação: travava após acerto** | Fase `reveal` não tinha botão nem timer para avançar | `EliminacaoScreen.jsx` |
| **Quiz Tempo: travava após erro** | Definia `phase: 'answering'` com `buzzedTeamIdx: null`; corrigido para `'question'` | `useGame.js` |
| **Componentes invisíveis no tema claro** | TimerDisplay, HangmanDisplay, BoardGame com cores hardcoded em branco | Vários componentes |
| **ErrorBoundary** | Adicionado componente de recuperação global para crashes inesperados | `main.jsx` |
| **Detecção de estado stale** | Ao recarregar, detecta e reseta jogos com perguntas inexistentes | `AppContext.jsx` |

### Sessão 3 — Redesign do Painel e Ajustes Visuais

| Item | Descrição | Arquivo |
|---|---|---|
| **Palavra invisível em "Encontre a palavra"** | Texto branco sobre fundo branco/cinza; corrigido para `var(--text)` (adapta-se ao tema) | `GameScreen.jsx` |
| **Overflow do gráfico "Partidas por Mês"** | Barras verticais ultrapassavam a altura do card; `BarChart` ganhou prop `height` com área reservada para rótulos | `BarChart.jsx`, `DashboardView.jsx` |
| **Redesign Dashboard, Turmas e Histórico** | Cards com borda colorida à esquerda, ícones de modo de jogo, medalhas no ranking, cards de resumo | `DashboardView.jsx`, `ClassesView.jsx`, `HistoryView.jsx` |
| **Conquistas com cores alternadas** | Badges conquistadas passaram a usar paleta alternada em vez de sempre dourado; não conquistadas seguem em cinza | `BadgesPanel.jsx` |
| **Card de perfil flutuante** | Rodapé da sidebar (nome/e-mail/logout) reformulado como card "glass" arredondado; alternador de tema removido (duplicado) | `InstructorDashboard.jsx` |
| **Menu lateral reformulado** | Itens com ícones em badges coloridos, indicador ativo em barra lateral, fundo em degradê de cinza claro | `InstructorDashboard.jsx` |
| **Títulos com gradiente** | Nova classe `.gradient-title` aplicada aos títulos das 4 abas principais | `index.css` |
| **Logo renomeado** | "MAX CAÇA / PALAVRAS" → "MAX - JOGOS / INTERATIVOS", maior e centralizado | `BrandLogo.jsx`, `InstructorDashboard.jsx` |

---

## Cores das Equipes

| Equipe | Cor | Hex |
|---|---|---|
| Equipe 1 | Ciano | `#00F2FF` |
| Equipe 2 | Rosa | `#FF007A` |
| Equipe 3 | Verde | `#39FF14` |
| Equipe 4 | Âmbar | `#FFBD33` |

---

## Licença

Projeto desenvolvido para uso educacional no SENAI CT Gurupi.

---

*Max - Jogos Interativos · SENAI CT Gurupi · 2026*
