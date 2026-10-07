import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useHistory } from './useHistory';
import * as R from './gameReducer';

/**
 * Camada fina sobre gameReducer: resolve dependencias (pergunta atual, jogo
 * ativo) e despacha as transicoes puras. Toda a regra de jogo vive no reducer,
 * que e testado em src/hooks/__tests__/gameReducer.test.js.
 */
export function useGame() {
  const { gameState, setGameState, questions, games, classes } = useAppContext();
  const { addHistoryRecord } = useHistory();

  const apply = (fn) => setGameState(fn);
  const currentQuestion = () => questions.find((q) => q.id === gameState.currentQuestionId);

  // ── Historico ──────────────────────────────────────────────────────────────
  // Antes addHistoryRecord era chamado DENTRO dos updaters de setGameState, que
  // o React executa duas vezes sob StrictMode — e cada chamada sorteava um uuid
  // novo, gravando duas partidas. Agora e um efeito, com id deterministico.
  const savedRef = useRef(null);

  const buildRecord = (state) => {
    const cls = classes.find((c) => c.id === state.classId);
    const students = cls?.students || [];
    const stats = state.studentStats || {};

    return {
      id: `${state.gameId || 'avulso'}-${state.startTime}`,
      gameId: state.gameId,
      classId: state.classId,
      gameMode: state.gameMode || 'cacapalavras',
      durationSeconds: Math.max(0, Math.floor((Date.now() - state.startTime) / 1000)),
      teams: state.teams,
      // Desempenho individual: so existe quando a turma tem alunos cadastrados
      // e eles foram distribuidos entre as equipes.
      perStudent: Object.entries(stats).map(([studentId, s]) => ({
        studentId,
        name: students.find((st) => st.id === studentId)?.name || 'Aluno removido',
        ...s,
      })),
    };
  };

  useEffect(() => {
    if (gameState.status !== 'finished' || !gameState.startTime) {
      if (gameState.status !== 'finished') savedRef.current = null;
      return;
    }
    const key = `${gameState.gameId || 'avulso'}-${gameState.startTime}`;
    if (savedRef.current === key) return;
    savedRef.current = key;
    Promise.resolve(addHistoryRecord(buildRecord(gameState)))
      .catch((err) => console.error('Falha ao salvar o historico da partida:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.status, gameState.startTime, gameState.gameId]);

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  const startGame = (teams, mode = 'cacapalavras', questionsArray = questions) => {
    if (!questionsArray || questionsArray.length === 0) {
      throw new Error('Nenhuma pergunta cadastrada!');
    }
    const gameId = sessionStorage.getItem('mcp_active_game_id');
    setGameState(R.createInitialState({
      teams,
      mode,
      questions: questionsArray,
      activeGame: games.find((g) => g.id === gameId) || null,
      gameId,
      classId: sessionStorage.getItem('mcp_active_class_id'),
    }));
  };

  const quitGame = () => setGameState({ status: 'idle' });

  const endBetsSession = () => {
    // Encerrar sessao de bets nao passa por status 'finished', entao o efeito
    // acima nao cobre este caso: gravamos aqui, fora de qualquer updater.
    if (gameState.status === 'playing' && gameState.startTime) {
      Promise.resolve(addHistoryRecord(buildRecord(gameState)))
        .catch((err) => console.error('Falha ao salvar o historico da partida:', err));
    }
    setGameState({ status: 'idle' });
  };

  return {
    gameState,
    startGame,
    quitGame,
    endBetsSession,

    togglePause: () => apply(R.togglePause),
    nextTurn: () => apply(R.nextTurn),
    setResponder: (studentId) => apply((s) => R.setResponder(s, studentId)),

    // Caça-Palavras
    answerQuiz: (isCorrect) => apply((s) => R.answerQuiz(s, isCorrect)),
    completeWordSearch: (timeLeft) => apply((s) => R.completeWordSearch(s, timeLeft)),
    failWordSearch: () => apply(R.failWordSearch),

    // Quiz Tempo
    buzzTeam: (teamIdx) => apply((s) => R.buzzTeam(s, teamIdx)),
    answerQuizTempo: (teamIdx, isCorrect) => apply((s) => R.answerQuizTempo(s, teamIdx, isCorrect)),
    skipQuizTempo: () => apply(R.skipQuizTempo),

    // Forca
    answerForcaQuiz: (isCorrect) => apply((s) => R.answerForcaQuiz(s, isCorrect)),
    guessForcaLetter: (letter) => apply((s) => R.guessForcaLetter(s, letter, currentQuestion())),

    // Eliminação
    answerEliminacao: (isCorrect) => apply((s) => R.answerEliminacao(s, isCorrect)),
    activateLifeline: (type) => apply((s) => R.activateLifeline(s, type, currentQuestion())),
    resumeFromAskTeam: () => apply(R.resumeFromAskTeam),
    nextEliminacaoRound: () => apply(R.nextEliminacaoRound),

    // Corrida
    answerCorrida: (isCorrect) => apply((s) => R.answerCorrida(s, isCorrect)),
    resolveSpecial: () => apply((s) => R.resolveSpecial(s)),

    // Bomba
    answerBomba: (isCorrect) => apply((s) => R.answerBomba(s, isCorrect)),
    explodeBomba: () => apply((s) => R.explodeBomba(s)),
    nextBombaRound: () => apply((s) => R.nextBombaRound(s)),

    // Duelo
    buzzDuelo: (teamIdx) => apply((s) => R.buzzDuelo(s, teamIdx)),
    answerDuelo: (teamIdx, isCorrect) => apply((s) => R.answerDuelo(s, teamIdx, isCorrect)),
    stealDuelo: (stealTeamIdx, isCorrect) => apply((s) => R.stealDuelo(s, stealTeamIdx, isCorrect)),

    // Bets
    spinCassino: (odds) => apply((s) => R.spinCassino(s, odds)),
    spinCassinoInstitucional: (odds) => apply((s) => R.spinCassinoInstitucional(s, odds)),
    nextCassinoTurn: () => apply(R.nextCassinoTurn),
    updateTeamScore: (teamIndex, delta) => apply((s) => R.updateTeamScore(s, teamIndex, delta)),
    addHouseBalance: (amount) => apply((s) => R.addHouseBalance(s, amount)),
  };
}
