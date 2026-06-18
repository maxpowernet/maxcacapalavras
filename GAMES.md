# 🎮 Max Caça Palavras — Especificação Completa do Projeto
> Plataforma educacional gamificada para instrutores e turmas técnicas  
> Desenvolvido para uso em telas interativas LG · SENAI CT Gurupi

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Autenticação e Perfis](#3-autenticação-e-perfis)
4. [Painel do Instrutor](#4-painel-do-instrutor)
5. [Criação de Jogos via Upload](#5-criação-de-jogos-via-upload)
6. [Configuração da Partida](#6-configuração-da-partida)
7. [Modos de Jogo](#7-modos-de-jogo)
8. [Sistema de Pontuação](#8-sistema-de-pontuação)
9. [Funcionalidades Extras](#9-funcionalidades-extras)
10. [Banco de Dados — Estrutura](#10-banco-de-dados--estrutura)
11. [Fluxo Completo da Aplicação](#11-fluxo-completo-da-aplicação)
12. [Diferenciais para o Prêmio IEL](#12-diferenciais-para-o-prêmio-iel)

---

## 1. Visão Geral

**Max Caça Palavras** é uma plataforma web educacional multiplayer que transforma qualquer material didático (PDF ou TXT) em jogos interativos de perguntas e respostas. Projetada para ser exibida em **telas interativas LG**, a aplicação permite que instrutores do SENAI conduzam dinâmicas competitivas em sala de aula de forma rápida, sem necessidade de digitação manual de conteúdo.

### Proposta de valor
- ✅ O instrutor faz upload do material → o sistema cria o jogo automaticamente
- ✅ Múltiplos modos de jogo usando o mesmo banco de perguntas
- ✅ Até 4 equipes competindo simultaneamente
- ✅ Histórico de resultados por turma e por jogo
- ✅ Funciona 100% no navegador, sem instalação

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Roteamento** | React Router v6 |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Auth + Storage) |
| **Parser de arquivos** | pdf.js (PDF) + FileReader API (TXT) |
| **Animações** | Framer Motion |
| **Ícones** | Lucide React |
| **Hospedagem** | Netlify (frontend) + Supabase (backend) |
| **Tela alvo** | LG Interactive Display (touch, 4K, 16:9) |

---

## 3. Autenticação e Perfis

### 3.1 Cadastro
Formulário simples com os campos:
- **Nome completo**
- **E-mail**
- **Senha** (mínimo 6 caracteres)

> Não há confirmação de e-mail obrigatória — o acesso é imediato após o cadastro.

### 3.2 Login
- Autenticação via **e-mail + senha** usando Supabase Auth
- Sessão persistida via `localStorage`
- Redirecionamento automático para o Dashboard após login

### 3.3 Perfis de usuário
Por ora, apenas um perfil: **Instrutor**. Cada instrutor tem acesso apenas aos seus próprios jogos, turmas e histórico.

---

## 4. Painel do Instrutor (Dashboard)

Tela principal após login, com três seções em abas ou cards de navegação:

### 4.1 Minhas Turmas
- Listar turmas cadastradas (ex: "Técnico em Desenvolvimento de Sistemas — 1º Ano")
- Criar nova turma (nome + ano/semestre)
- Editar e excluir turmas
- Cada turma exibe: nome, quantidade de jogos associados, data de criação

### 4.2 Meus Jogos
- Listar jogos criados pelo instrutor
- Criar novo jogo (via upload — ver seção 5)
- Visualizar perguntas de um jogo
- Editar e excluir perguntas individualmente
- Associar jogo a uma turma
- Iniciar partida (ver seção 6)

### 4.3 Histórico
- Listar partidas realizadas com: data, turma, modo de jogo, equipes e pontuação final
- Visualizar relatório detalhado de uma partida
- Exportar relatório em PDF

---

## 5. Criação de Jogos via Upload

### 5.1 Formatos aceitos
- `.pdf`
- `.txt`

### 5.2 Padrão esperado no arquivo

O sistema (`parseFile.js`) lê o documento procurando o seguinte padrão:

```
Pergunta: Qual é a linguagem de marcação da web?
A) Python
B) HTML
C) Java
D) C++
Correta: B
Palavra: HTML
```

Campos obrigatórios por questão:
- `Pergunta:` — enunciado da questão
- `A)` a `D)` — quatro alternativas
- `Correta:` — letra da alternativa correta (A, B, C ou D)
- `Palavra:` — palavra-chave que será usada no caça-palavras e outros modos

### 5.3 Processo de criação
1. Instrutor clica em **"Novo Jogo"**
2. Preenche o nome do jogo e seleciona a turma associada
3. Faz upload do arquivo
4. O sistema processa e exibe uma **prévia das perguntas** extraídas
5. Instrutor revisa, pode editar ou excluir perguntas individualmente
6. Clica em **"Salvar Jogo"** — perguntas são persistidas no Supabase

### 5.4 Edição manual
Após criação, o instrutor pode acessar o jogo e:
- Editar qualquer pergunta, alternativa, resposta correta ou palavra-chave
- Adicionar novas perguntas manualmente (formulário simples)
- Reordenar perguntas via drag-and-drop

---

## 6. Configuração da Partida

Antes de iniciar qualquer modo de jogo, o instrutor configura:

| Campo | Opções |
|---|---|
| **Jogo selecionado** | Lista dos jogos criados |
| **Modo de jogo** | Ver seção 7 |
| **Número de equipes** | 2, 3 ou 4 |
| **Nome de cada equipe** | Campo de texto livre |
| **Pontuação alvo** | 50 / 80 / 100 / 150 pontos |
| **Tempo por pergunta** | 15s / 30s / 45s |

Cada equipe recebe uma **cor identificadora**:
- 🔵 Ciano (`#00F2FF`)
- 🔴 Rosa (`#FF007A`)
- 🟢 Verde (`#39FF14`)
- 🟡 Âmbar (`#FFBD33`)

---

## 7. Modos de Jogo

Todos os modos utilizam o **mesmo banco de perguntas** criado via upload. O instrutor escolhe o modo antes de iniciar a partida.

---

### 7.1 🔍 Caça-Palavras (Modo Original)

**Dinâmica:** Sistema de turnos por equipe.

**Fase 1 — Quiz:**
- A pergunta de múltipla escolha aparece na tela
- A equipe da vez discute e um representante clica na resposta
- Se **acertar** → avança para a Fase 2

**Fase 2 — Caça-Palavras:**
- Um grid 14×14 é gerado dinamicamente com a palavra-chave escondida
- A equipe tem **30 segundos** para encontrar e marcar a palavra
- A seleção é feita por toque/clique e arrasto (horizontal ou vertical)

**Pontuação:**
- Palavra encontrada em até 15s → **10 pontos**
- Palavra encontrada entre 15s e 30s → **5 pontos**
- Erro no quiz ou tempo esgotado → **0 pontos**, passa o turno

**Vitória:** Primeira equipe a atingir a pontuação alvo.

---

### 7.2 ⚡ Quiz Clássico por Tempo

**Dinâmica:** Todas as equipes respondem simultaneamente.

- Pergunta aparece na tela
- Cada equipe tem um **dispositivo ou botão** para registrar a resposta
- Countdown visível para todos (10s, 20s ou 30s — configurável)
- A **primeira equipe a acertar** ganha os pontos
- Se nenhuma acertar no tempo, ninguém pontua e a resposta é revelada

**Pontuação:**
- 1ª a acertar → **10 pontos**
- 2ª a acertar → **5 pontos**
- 3ª e 4ª → **2 pontos**

**Variação:** Modo "Tudo ou Nada" — só a 1ª equipe correta pontua.

---

### 7.3 🎡 Roleta de Perguntas

**Dinâmica:** A equipe da vez gira uma roleta que define a categoria/dificuldade da próxima pergunta.

Categorias da roleta (configuráveis pelo instrutor):
- 🟢 **Fácil** — +5 pts
- 🟡 **Médio** — +10 pts
- 🔴 **Difícil** — +15 pts
- 💀 **Desafio** — +20 pts ou -10 pts se errar
- 🎁 **Bônus** — +15 pts sem pergunta (sorte pura)
- 🔄 **Passa a vez** — perde o turno

A pergunta sorteada corresponde à dificuldade da roleta. O instrutor marca as perguntas com dificuldade no momento da criação ou revisão.

---

### 7.4 🔤 Forca em Equipe

**Dinâmica:** Usa a **palavra-chave** de cada questão.

1. A equipe da vez recebe a pergunta e acerta → revela a Forca
2. A palavra-chave aparece como `_ _ _ _ _ _`
3. A equipe tenta adivinhar letras uma por vez (clique em teclado virtual na tela)
4. **6 erros** = boneco completo = perde o turno sem pontuar
5. Adivinhou antes de 6 erros = pontua conforme letras restantes

**Pontuação:**
- 0 a 2 erros → **15 pontos**
- 3 a 4 erros → **10 pontos**
- 5 erros → **5 pontos**
- 6 erros → **0 pontos**

---

### 7.5 🧩 Quiz Eliminação (Estilo Milionário)

**Dinâmica:** Uma equipe por vez, estilo "Quem quer ser milionário".

Cada rodada tem **5 perguntas em sequência**, com dificuldade crescente e pontuação crescente:

| Nível | Pontos |
|---|---|
| Questão 1 | 2 pts |
| Questão 2 | 5 pts |
| Questão 3 | 10 pts |
| Questão 4 | 20 pts |
| Questão 5 | 40 pts |

**Ajudas disponíveis** (1 uso por rodada cada):
- 🃏 **50/50** — elimina 2 alternativas erradas
- ⏩ **Pular** — descarta a pergunta sem pontuar nem perder
- 👥 **Consultar equipe** — pausa o timer por 15s para discussão interna

Se errar em qualquer nível → perde tudo da rodada.

---

### 7.6 🏃 Corrida do Conhecimento (Tabuleiro Digital)

**Dinâmica:** Mapa de casas no estilo jogo de tabuleiro. Equipes avançam conforme acertos.

- Tabuleiro com **30 casas** gerado visualmente na tela
- Cada acerto avança a equipe conforme tempo de resposta:
  - Resposta rápida (< 10s) → avança **3 casas**
  - Resposta normal (10–20s) → avança **2 casas**
  - Resposta lenta (> 20s) → avança **1 casa**
- Casas especiais (sorteadas aleatoriamente):
  - ⭐ **Estrela** — avança 2 casas extras
  - 💣 **Armadilha** — volta 2 casas
  - 🔄 **Desafio bônus** — pergunta extra para ganhar mais 3 casas
  - 🛑 **Pare** — perde próximo turno

**Vitória:** Primeira equipe a chegar ou ultrapassar a casa 30.

---

### 7.7 💣 Bomba Relógio

**Dinâmica:** Modo de pressão e humor para descontração.

- Todas as equipes participam simultaneamente
- Uma "bomba" virtual aparece na tela com um **countdown aleatório** (15s a 45s — oculto para os jogadores)
- A equipe que estiver com a bomba quando o tempo zerar **perde pontos** (-5 pts)
- Mecânica: a equipe responde uma pergunta corretamente para "passar a bomba" para a próxima equipe
- Se errar → não consegue passar, a bomba continua com ela

---

### 7.8 ⚔️ Modo Duelo

**Dinâmica:** Confronto direto entre duas equipes (funciona com 2 a 4 equipes em chave eliminatória).

- Duas equipes recebem a **mesma pergunta** simultaneamente
- Cada equipe tem um botão de "buzzer" (tecla configurável ou área da tela)
- A **primeira a pressionar o buzzer** tenta responder:
  - Acertou → **+10 pts**
  - Errou → **-5 pts** e a outra equipe pode roubar respondendo corretamente

Com 4 equipes:
- Fase de grupos: cada equipe duela com as outras uma vez
- Semifinal e Final entre os melhores

---

### 7.9 🎰 Jogos de Bets (Simuladores Financeiros)

**Dinâmica:** Diferente dos outros modos, este é um módulo de educação financeira acessado pelo menu **Jogos de Bets**. Não requer perguntas, focando puramente em matemática, probabilidade e ganância. As equipes começam com um saldo fictício (ex: R$ 1000).

- **Cassino Educacional (Caça-Níquel):** Gira rolos de emojis em busca da trinca perfeita. Demonstra o baixo RTP (Return to Player) das máquinas caça-níqueis.
- **✈️ Aviãozinho (Crash):** Um multiplicador cresce e as equipes devem sacar antes que "estoure". Ensina sobre controle de risco e bolhas especulativas.
- **📦 Caixas Misteriosas (Loot Box):** Compra de baús com chances distorcidas (85% de lixo, 1% de lendário). Demonstra a matemática predatória de microtransações e jogos mobile.
- **🎡 Roleta da Casa:** Aposta em cores (Vermelho/Preto). A existência do **Zero Verde (10%)** mostra como a "vantagem da casa" sempre leva todo o dinheiro no longo prazo.

---

## 8. Sistema de Pontuação

### 8.1 Pontuação alvo
Configurável antes de cada partida: **50 / 80 / 100 / 150 pontos**.

### 8.2 Placar em tempo real
- Sidebar lateral sempre visível durante o jogo
- Cards de equipe com: nome, pontuação atual, barra de progresso até o alvo
- Animação de pontos ao pontuar (+X pts flutuando sobre o card)
- Equipe líder destacada visualmente

### 8.3 Tela de vitória
- Confetti animado
- Ranking final de todas as equipes
- Pontuação e tempo total de partida
- Botões: **"Jogar Novamente"** (mesmo jogo/modo) e **"Voltar ao Dashboard"**

---

## 9. Funcionalidades Extras

### 9.1 📊 Dashboard de Desempenho
- Gráfico de barras: pontuação média por turma ao longo do semestre
- Gráfico de linha: evolução de desempenho por jogo
- Ranking de equipes mais bem-sucedidas
- Perguntas com maior taxa de erro (para o instrutor revisar o conteúdo)

### 9.2 🖨️ Exportação de Relatório PDF
- Após cada partida, o instrutor pode gerar um PDF com:
  - Data e modo de jogo
  - Equipes participantes
  - Pontuação final e ranking
  - Perguntas respondidas e taxa de acerto por equipe

### 9.3 🔊 Narração por Text-to-Speech
- Opção ativável nas configurações da partida
- Ao exibir uma pergunta, o sistema lê o enunciado em voz alta (Web Speech API)
- Auxilia alunos com dificuldade de leitura ou em ambientes com distância da tela

### 9.4 📱 QR Code de Placar
- Durante a partida, um QR Code fica visível em um canto da tela
- Os alunos que não estão no controle do jogo podem escanear e acompanhar o **placar ao vivo** no celular
- Página de placar: somente leitura, atualização em tempo real via Supabase Realtime

### 9.5 🏆 Sistema de Badges por Turma
- Cada turma acumula conquistas ao longo do semestre:
  - 🥇 **Primeira Vitória** — ganhou o primeiro jogo
  - 🔥 **Sequência Perfeita** — acertou 5 perguntas seguidas sem errar
  - ⚡ **Mais Rápidos** — maior média de velocidade de resposta em uma partida
  - 🧠 **Cérebros da Turma** — maior taxa de acerto geral no semestre
  - 🎯 **Precisão Total** — venceu sem usar nenhuma ajuda
- Badges exibidos no Dashboard e na tela de vitória

### 9.6 🎨 Personalização Visual
- O instrutor pode escolher o **tema de cores** da interface durante a partida:
  - 🌙 Dark Neon (padrão)
  - ☀️ Light Clean
  - 🎓 SENAI Institucional (azul e vermelho)
- Possibilidade de adicionar o **logo da instituição** que aparece durante o jogo

### 9.7 ⏸️ Modo Pausa
- Botão de pausa visível apenas para o instrutor (clique no logo)
- Congela o timer e exibe overlay de pausa
- Útil para explicações ou interrupções em sala

### 9.8 🔁 Embaralhamento Inteligente
- As perguntas são embaralhadas a cada nova partida
- O sistema garante que perguntas já usadas na sessão atual não se repitam antes de esgotar o banco

---

## 10. Banco de Dados — Estrutura

### Tabelas Supabase

```sql
-- Usuários (gerenciado pelo Supabase Auth)
profiles (
  id uuid PRIMARY KEY,          -- mesmo id do auth.users
  name text,
  email text,
  created_at timestamp
)

-- Turmas
classes (
  id uuid PRIMARY KEY,
  instructor_id uuid REFERENCES profiles(id),
  name text,                    -- "Técnico DS - 1º Ano"
  semester text,                -- "2026.1"
  created_at timestamp
)

-- Jogos
games (
  id uuid PRIMARY KEY,
  instructor_id uuid REFERENCES profiles(id),
  class_id uuid REFERENCES classes(id),
  name text,                    -- "Quiz HTML e CSS"
  created_at timestamp
)

-- Perguntas
questions (
  id uuid PRIMARY KEY,
  game_id uuid REFERENCES games(id),
  question text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option char(1),       -- 'A', 'B', 'C' ou 'D'
  keyword text,                 -- palavra-chave para os jogos
  difficulty int DEFAULT 2,     -- 1=fácil, 2=médio, 3=difícil, 4=desafio
  order_index int
)

-- Partidas
matches (
  id uuid PRIMARY KEY,
  game_id uuid REFERENCES games(id),
  instructor_id uuid REFERENCES profiles(id),
  game_mode text,               -- 'cacapalavras', 'quiz_tempo', etc.
  target_score int,
  turn_time int,
  played_at timestamp,
  duration_seconds int,
  winner_team text
)

-- Equipes por Partida
teams (
  id uuid PRIMARY KEY,
  match_id uuid REFERENCES matches(id),
  name text,
  color text,                   -- hex da cor
  final_score int
)

-- Respostas por Rodada (para relatórios e análise)
round_logs (
  id uuid PRIMARY KEY,
  match_id uuid REFERENCES matches(id),
  team_id uuid REFERENCES teams(id),
  question_id uuid REFERENCES questions(id),
  answered_correctly boolean,
  time_taken_seconds int,
  points_earned int,
  game_phase text               -- 'quiz', 'wordsearch', 'forca', etc.
)
```

---

## 11. Fluxo Completo da Aplicação

```
[Tela Inicial]
    ↓
[Cadastro / Login]
    ↓
[Dashboard do Instrutor]
    ├── [Minhas Turmas] → Criar / Editar turmas
    ├── [Meus Jogos]
    │       ├── Criar Jogo → Upload PDF/TXT → Preview → Salvar
    │       ├── Editar perguntas do jogo
    │       └── Iniciar Partida
    │               ↓
    │       [Configurar Partida]
    │           → Selecionar modo de jogo
    │           → Configurar equipes (2–4)
    │           → Definir pontuação alvo e tempo
    │               ↓
    │       [Jogo em Execução]
    │           → Turnos / Rounds conforme modo escolhido
    │           → Placar em tempo real
    │               ↓
    │           → Tela de Vitória
    │           → Ranking final
    │           → Salvar no histórico
    ├── [Jogos de Bets]
    │       ├── Configuração Rápida de Equipes (Setup Expresso)
    │       ├── Selecionar Jogo (Cassino, Crash, Loot Box, Roleta)
    │       └── Iniciar Partida Imediatamente (Bypass de perguntas)
    └── [Histórico]
            → Ver partidas anteriores
            → Exportar relatório PDF
            → Ver estatísticas da turma
```

---

## 12. Diferenciais para o Prêmio IEL

O projeto se enquadra na modalidade **Destaque Sistema S — Educação Inovadora**, com forte argumento nos seguintes critérios de avaliação:

### Critério 1 — Estrutura do Programa
- Ferramenta criada **dentro do SENAI, por instrutor do SENAI**, para uso direto em sala
- Integrada ao currículo do Técnico em Desenvolvimento de Sistemas
- Documentação técnica formal e código versionado

### Critério 2 — Mecanismos Internos de Apoio
- Substituição de atividades passivas por **aprendizado ativo e competitivo**
- Feedback imediato sobre acertos e erros durante a partida
- Histórico de desempenho acessível ao instrutor para replanejamento pedagógico

### Critério 3 — Desenvolvimento de Parcerias
- Uso das **telas interativas LG** já existentes na infraestrutura do SENAI
- Potencial de expansão para outras unidades SENAI no Tocantins e no Brasil

### Critério 4 — Mecanismos de Avaliação
- Dashboard com análise de desempenho por turma e por questão
- Exportação de relatórios PDF por partida
- Identificação das perguntas com maior taxa de erro (melhoria contínua do conteúdo)

### Critério 5 — Escalabilidade
- A mesma plataforma funciona para **qualquer disciplina** do SENAI
- Qualquer instrutor pode criar jogos a partir de seu próprio material didático
- Arquitetura multi-tenant pronta para expansão para outras unidades

### Inovação de Processo (Manual de Oslo)
> A aplicação representa uma **inovação de processo** no método de ensino: transforma a revisão de conteúdo — tradicionalmente passiva (leitura, exercícios impressos) — em uma experiência gamificada, colaborativa e mensurável, usando tecnologia já disponível na instituição.

---

## 📁 Estrutura de Pastas Sugerida (React + Vite)

```
src/
├── components/
│   ├── ui/               # Componentes genéricos (Button, Card, Modal, Input)
│   ├── game/             # Componentes de jogo (Grid, Timer, PlayerCard, Scoreboard)
│   └── dashboard/        # Componentes do painel (GameCard, ClassCard, HistoryItem)
├── pages/
│   ├── Auth/             # Login e Cadastro
│   ├── Dashboard/        # Painel principal
│   ├── Games/            # Criação e edição de jogos
│   ├── Setup/            # Configuração da partida
│   ├── Play/             # Telas de jogo por modo
│   │   ├── CacaPalavras/
│   │   ├── QuizTempo/
│   │   ├── Roleta/
│   │   ├── Forca/
│   │   ├── Eliminacao/
│   │   ├── Corrida/
│   │   ├── Bomba/
│   │   └── Duelo/
│   ├── Victory/          # Tela de vitória
│   └── History/          # Histórico de partidas
├── hooks/
│   ├── useGame.js        # Lógica central do jogo
│   ├── useTimer.js       # Hook de countdown
│   └── useSupabase.js    # Queries e mutações Supabase
├── lib/
│   ├── supabase.js       # Configuração do cliente Supabase
│   ├── parseFile.js      # Parser de PDF e TXT
│   └── gridGenerator.js  # Gerador de grid do caça-palavras
├── store/
│   └── gameStore.js      # Estado global (Zustand ou Context API)
└── styles/
    └── globals.css       # Variáveis CSS e estilos base
```

---

*Documento gerado em junho de 2026 · Max Caça Palavras · SENAI CT Gurupi*
