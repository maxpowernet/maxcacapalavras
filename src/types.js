/**
 * Contratos de dados do projeto.
 *
 * Nao ha nenhum tipo em tempo de execucao aqui: sao apenas typedefs JSDoc,
 * verificados por `checkJs` no jsconfig.json. A escolha por JSDoc em vez de
 * TypeScript evita renomear ~40 arquivos e mudar o build, mantendo a checagem
 * de contrato — que e onde os bugs apareciam (pergunta sem `word`, `correct`
 * nulo chegando ao jogo).
 */

/**
 * Uma pergunta de multipla escolha.
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} q            Enunciado.
 * @property {string[]} options    Alternativas, ja com o prefixo "A) ".
 * @property {number} correct      Indice 0-based; -1 quando desconhecida.
 * @property {string} word         Palavra escondida: A-Z, 4..MAX_WORD_LEN.
 */

/**
 * Aluno de uma turma. Fica embutido no documento da turma.
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} SchoolClass
 * @property {string} id
 * @property {string} name
 * @property {string} createdBy
 * @property {Student[]} [students]
 */

/**
 * Equipe dentro de uma partida.
 * @typedef {Object} Team
 * @property {number} id
 * @property {string} name
 * @property {number} score
 * @property {string[]} [memberIds]   Ids dos alunos da equipe.
 * @property {number} [responderPos]  Posicao do rodizio do respondente.
 * @property {number} [candies]       Cassino Institucional.
 * @property {number} [instStreak]    Cassino Institucional.
 */

/**
 * Desempenho individual acumulado durante a partida.
 * @typedef {Object} StudentStat
 * @property {number} correct
 * @property {number} wrong
 * @property {number} points
 */

/**
 * Estado completo da partida. Persistido em users/{uid}/state/game_state.
 * @typedef {Object} GameState
 * @property {'idle'|'playing'|'finished'} status
 * @property {string} [gameMode]
 * @property {string|null} [gameId]
 * @property {string|null} [classId]
 * @property {number} [startTime]
 * @property {Team[]} [teams]
 * @property {number} [currentTeamIndex]
 * @property {string|null} [currentResponderId]
 * @property {Record<string, StudentStat>} [studentStats]
 * @property {string[]} [allQuestionIds]
 * @property {string[]} [poolIds]
 * @property {string} [currentQuestionId]
 * @property {string} [phase]
 * @property {number} [winGoal]
 * @property {number} [scorePerQ]
 * @property {boolean} [paused]
 * @property {number} [targetScore]
 * @property {string} [scoreType]
 * @property {string[]} [usedQuestionIds]
 * @property {number} [questionStartTime]
 *
 * Quiz por Tempo
 * @property {number|null} [buzzedTeamIdx]
 * @property {number[]} [buzzOrder]
 *
 * Forca
 * @property {string[]} [forcaGuessed]
 * @property {string[]} [forcaWrong]
 *
 * Eliminacao
 * @property {number} [eliminacaoLevel]
 * @property {number} [roundAccumulated]
 * @property {{fiftyfifty: boolean, skip: boolean, askTeam: boolean}} [lifelines]
 * @property {number[]} [removedOptions]
 * @property {number} [revealEarned]
 * @property {number} [revealAccumulated]
 * @property {boolean} [revealRoundOver]
 *
 * Corrida
 * @property {number[]} [boardPositions]
 * @property {{index: number, type: string}[]} [specialSquares]
 * @property {{index: number, type: string}|null} [currentSpecial]
 * @property {number|null} [pendingSkipTeam]
 *
 * Bomba
 * @property {number} [bombTeamIndex]
 * @property {number} [bombDuration]
 * @property {number} [bombStartTime]
 *
 * Duelo
 * @property {{a: number, b: number}[]} [dueloPairs]
 * @property {number} [currentDuelPairIdx]
 * @property {number|null} [duelBuzzedTeam]
 * @property {number|null} [stealFromTeam]
 *
 * Bets
 * @property {number} [houseBalance]
 * @property {number} [spinCost]
 * @property {{emojis: string[], isWin: boolean, prize: number, teamId: number,
 *   candyAwarded?: boolean, candyReturned?: boolean}|null} [lastSpinResult]
 */

/**
 * Registro de uma partida encerrada.
 * @typedef {Object} HistoryRecord
 * @property {string} id
 * @property {string|null} gameId
 * @property {string|null} classId
 * @property {string} gameMode
 * @property {number} durationSeconds
 * @property {Team[]} teams
 * @property {Array<{studentId: string, name: string, correct: number, wrong: number, points: number}>} [perStudent]
 */

/**
 * Banco de perguntas reutilizavel, opcionalmente compartilhado.
 * @typedef {Object} QuestionBank
 * @property {string} id
 * @property {string} name
 * @property {Question[]} questions
 * @property {boolean} isPublic
 * @property {string} ownerId
 * @property {string} ownerName
 * @property {number} createdAt
 */

export {};
