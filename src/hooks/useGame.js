import { useAppContext } from '../context/AppContext';
import { useHistory } from './useHistory';

// ─── Helpers privados ────────────────────────────────────────────────────────

// Bug 2 fix: _nextPool uses prev.allQuestionIds stored in gameState instead of
// the questions closure (which is stale when called inside async setState updaters)
function _nextPool(prev) {
  let newPool = [...prev.poolIds];
  newPool.shift();
  if (newPool.length === 0) {
    newPool = [...prev.allQuestionIds].sort(() => Math.random() - 0.5);
  }
  return { poolIds: newPool, currentQuestionId: newPool[0] };
}

function generateSpecialSquares(size) {
  const types = ['star', 'trap', 'bonus_question', 'stop'];
  const squares = [];
  const usedIndices = new Set([0, 1]);
  const count = Math.floor(size * 0.2);
  for (let i = 0; i < count; i++) {
    let idx;
    do { idx = Math.floor(Math.random() * (size - 2)) + 2; } while (usedIndices.has(idx));
    usedIndices.add(idx);
    squares.push({ index: idx, type: types[Math.floor(Math.random() * types.length)] });
  }
  return squares;
}

function generateDueloPairs(teamCount) {
  const pairs = [];
  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs.sort(() => Math.random() - 0.5);
}

function randomBombDuration() {
  return Math.floor(Math.random() * 30) + 15;
}

const ELIMINACAO_POINTS = [2, 5, 10, 20, 40];

export function useGame() {
  const { gameState, setGameState, questions, games } = useAppContext();
  const { addHistoryRecord } = useHistory();

  const _saveHistory = (prev, newTeams) => {
    const duration = Math.floor((Date.now() - prev.startTime) / 1000);
    addHistoryRecord({
      gameId: prev.gameId,
      classId: prev.classId,
      gameMode: prev.gameMode || 'cacapalavras',
      durationSeconds: duration,
      teams: newTeams,
    });
  };

  // Bug 1 fix: accept questionsArray as 3rd param so the caller can pass the
  // freshly-selected questions without relying on the React state closure
  // (which may still hold the previous render's value due to React 18 batching).
  const startGame = (teams, mode = 'cacapalavras', questionsArray = questions) => {
    if (!questionsArray || questionsArray.length === 0)
      throw new Error("Nenhuma pergunta cadastrada!");

    const activeGameId = sessionStorage.getItem('mcp_active_game_id');
    const activeGame = games.find(g => g.id === activeGameId) || null;

    let targetScore = 100;
    let scorePerQ = 10;
    let scoreType = 'total';

    if (activeGame) {
      targetScore = activeGame.targetScore;
      scoreType = activeGame.scoreType;
      scorePerQ = scoreType === 'total'
        ? targetScore / activeGame.questions.length
        : activeGame.targetScore;
    }

    const shuffledIds = [...questionsArray].sort(() => Math.random() - 0.5).map(q => q.id);
    const winGoal = scoreType === 'per_question' ? questionsArray.length * targetScore : targetScore;

    setGameState({
      status: 'playing',
      gameMode: mode,
      gameId: activeGameId,
      classId: sessionStorage.getItem('mcp_active_class_id'),
      startTime: Date.now(),
      targetScore,
      scorePerQ,
      scoreType,
      winGoal,
      paused: false,
      teams: teams.map((t, idx) => ({
        id: idx,
        name: t.name,
        score: ['cassino', 'crash', 'lootbox', 'roleta', 'cassino_inst'].includes(mode) ? 500 : 0,
        ...(mode === 'cassino_inst' ? { candies: 0, instStreak: 0 } : {}),
      })),
      currentTeamIndex: 0,
      usedQuestionIds: [],
      // Bug 2 fix: store all IDs inside gameState so _nextPool can use prev.allQuestionIds
      allQuestionIds: shuffledIds,
      poolIds: [...shuffledIds],
      currentQuestionId: shuffledIds[0],
      phase: mode === 'quiz_tempo' ? 'question'
           : mode === 'bomba' ? 'question'
           : mode === 'duelo' ? 'waiting_buzz'
           : 'quiz',
      // Quiz Tempo
      buzzedTeamIdx: null,
      buzzOrder: [],
      // Forca
      forcaGuessed: [],
      forcaWrong: [],
      // Eliminação
      eliminacaoLevel: 0,
      roundAccumulated: 0,
      lifelines: { fiftyfifty: true, skip: true, askTeam: true },
      removedOptions: [],
      // Corrida
      boardPositions: teams.map(() => 0),
      specialSquares: mode === 'corrida' ? generateSpecialSquares(30) : [],
      questionStartTime: Date.now(),
      currentSpecial: null,
      // Bomba
      bombTeamIndex: 0,
      bombDuration: randomBombDuration(),
      bombStartTime: Date.now(),
      // Duelo
      dueloPairs: mode === 'duelo' ? generateDueloPairs(teams.length) : [],
      currentDuelPairIdx: 0,
      duelBuzzedTeam: null,
      stealFromTeam: null,
      // Cassino
      houseBalance: 0,
      spinCost: 50,
      lastSpinResult: null,
    });
  };

  const togglePause = () => {
    setGameState(prev => ({ ...prev, paused: !prev.paused }));
  };

  // ─── Caça-Palavras ──────────────────────────────────────────

  const answerQuiz = (isCorrect) => {
    if (isCorrect) {
      setGameState(prev => ({ ...prev, phase: 'wordsearch' }));
    } else {
      nextTurn();
    }
  };

  const completeWordSearch = (timeLeft) => {
    setGameState(prev => {
      const raw = timeLeft >= 15 ? prev.scorePerQ : prev.scorePerQ / 2;
      // Arredonda para inteiro (evita placares fracionados tipo "1.3") e garante ao menos 1 ponto por acerto
      const points = Math.max(1, Math.round(raw));
      const newTeams = [...prev.teams];
      newTeams[prev.currentTeamIndex].score += points;
      const isWin = newTeams[prev.currentTeamIndex].score >= prev.winGoal;
      if (isWin) {
        _saveHistory(prev, newTeams);
        return { ...prev, teams: newTeams, status: 'finished' };
      }
      return { ...prev, teams: newTeams, phase: 'turn_transition' };
    });
  };

  const failWordSearch = () => {
    setGameState(prev => ({ ...prev, phase: 'turn_transition' }));
  };

  // ─── Quiz Tempo ─────────────────────────────────────────────

  const buzzTeam = (teamIdx) => {
    setGameState(prev => {
      if (prev.buzzedTeamIdx !== null) return prev;
      return { ...prev, buzzedTeamIdx: teamIdx, buzzOrder: [...(prev.buzzOrder || []), teamIdx], phase: 'answering' };
    });
  };

  const answerQuizTempo = (teamIdx, isCorrect) => {
    setGameState(prev => {
      const buzzPos = (prev.buzzOrder || []).indexOf(teamIdx);
      const pts = isCorrect ? (buzzPos === 0 ? 10 : buzzPos === 1 ? 5 : 2) : -2;
      const newTeams = [...prev.teams];
      newTeams[teamIdx].score = Math.max(0, newTeams[teamIdx].score + pts);

      if (isCorrect || (prev.buzzOrder || []).length >= prev.teams.length) {
        const isWin = newTeams.some(t => t.score >= prev.winGoal);
        if (isWin) {
          _saveHistory(prev, newTeams);
          return { ...prev, teams: newTeams, status: 'finished' };
        }
        const next = _nextPool(prev);
        return { ...prev, teams: newTeams, phase: 'question', buzzedTeamIdx: null, buzzOrder: [], ...next };
      }
      // Wrong answer but other teams haven't buzzed yet — go back to 'question'
      // so the buzzer buttons reappear for the remaining teams.
      return { ...prev, teams: newTeams, phase: 'question', buzzedTeamIdx: null };
    });
  };

  const skipQuizTempo = () => {
    setGameState(prev => {
      const next = _nextPool(prev);
      return { ...prev, phase: 'question', buzzedTeamIdx: null, buzzOrder: [], ...next };
    });
  };

  // ─── Forca ──────────────────────────────────────────────────

  const answerForcaQuiz = (isCorrect) => {
    if (isCorrect) {
      setGameState(prev => ({ ...prev, phase: 'forca', forcaGuessed: [], forcaWrong: [] }));
    } else {
      nextTurn();
    }
  };

  const guessForcaLetter = (letter) => {
    setGameState(prev => {
      const question = questions.find(q => q.id === prev.currentQuestionId);
      if (!question) return prev;
      const word = question.word.toUpperCase();
      const guessed = [...(prev.forcaGuessed || [])];
      const wrong = [...(prev.forcaWrong || [])];
      if (guessed.includes(letter) || wrong.includes(letter)) return prev;

      if (word.includes(letter)) {
        const newGuessed = [...guessed, letter];
        const allFound = word.split('').every(l => newGuessed.includes(l));
        if (allFound) {
          const mult = wrong.length <= 2 ? 1 : wrong.length <= 4 ? 0.66 : 0.33;
          const pts = Math.round(prev.scorePerQ * mult * 10) / 10;
          const newTeams = [...prev.teams];
          newTeams[prev.currentTeamIndex].score += pts;
          const isWin = newTeams[prev.currentTeamIndex].score >= prev.winGoal;
          if (isWin) {
            _saveHistory(prev, newTeams);
            return { ...prev, teams: newTeams, status: 'finished', forcaGuessed: newGuessed };
          }
          return { ...prev, teams: newTeams, phase: 'turn_transition', forcaGuessed: newGuessed };
        }
        return { ...prev, forcaGuessed: newGuessed };
      } else {
        const newWrong = [...wrong, letter];
        if (newWrong.length >= 6) {
          return { ...prev, forcaWrong: newWrong, phase: 'turn_transition' };
        }
        return { ...prev, forcaWrong: newWrong };
      }
    });
  };

  // ─── Eliminação ─────────────────────────────────────────────

  const answerEliminacao = (isCorrect) => {
    setGameState(prev => {
      if (isCorrect) {
        const earned = ELIMINACAO_POINTS[prev.eliminacaoLevel];
        const accumulated = (prev.roundAccumulated || 0) + earned;
        if (prev.eliminacaoLevel >= 4) {
          const newTeams = [...prev.teams];
          newTeams[prev.currentTeamIndex].score += accumulated;
          const isWin = newTeams[prev.currentTeamIndex].score >= prev.winGoal;
          if (isWin) {
            _saveHistory(prev, newTeams);
            return { ...prev, teams: newTeams, status: 'finished' };
          }
          const nextIdx = (prev.currentTeamIndex + 1) % prev.teams.length;
          const next = _nextPool(prev);
          return { ...prev, teams: newTeams, phase: 'reveal', currentTeamIndex: nextIdx, eliminacaoLevel: 0, roundAccumulated: 0, removedOptions: [], ...next };
        }
        const next = _nextPool(prev);
        return { ...prev, phase: 'reveal', eliminacaoLevel: prev.eliminacaoLevel + 1, roundAccumulated: accumulated, ...next };
      } else {
        const nextIdx = (prev.currentTeamIndex + 1) % prev.teams.length;
        const next = _nextPool(prev);
        return { ...prev, phase: 'eliminated', currentTeamIndex: nextIdx, eliminacaoLevel: 0, roundAccumulated: 0, removedOptions: [], ...next };
      }
    });
  };

  // Bug 4 fix: renamed from useLifeline to activateLifeline to avoid the ESLint
  // react-hooks/rules-of-hooks false positive (functions starting with "use" are
  // treated as hooks and cannot be called inside event-handler callbacks).
  const activateLifeline = (type) => {
    setGameState(prev => {
      if (!prev.lifelines[type]) return prev;
      const newLifelines = { ...prev.lifelines, [type]: false };
      if (type === 'fiftyfifty') {
        const question = questions.find(q => q.id === prev.currentQuestionId);
        if (!question) return { ...prev, lifelines: newLifelines };
        const wrongIndices = question.options.map((_, i) => i).filter(i => i !== question.correct);
        const toRemove = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
        return { ...prev, lifelines: newLifelines, removedOptions: toRemove };
      }
      if (type === 'skip') {
        const next = _nextPool(prev);
        return { ...prev, lifelines: newLifelines, phase: 'quiz', removedOptions: [], ...next };
      }
      return { ...prev, lifelines: newLifelines, phase: 'ask_team_pause' };
    });
  };

  const resumeFromAskTeam = () => {
    setGameState(prev => ({ ...prev, phase: 'quiz' }));
  };

  const nextEliminacaoRound = () => {
    setGameState(prev => ({ ...prev, phase: 'quiz', removedOptions: [] }));
  };

  // ─── Corrida ────────────────────────────────────────────────

  const answerCorrida = (isCorrect) => {
    setGameState(prev => {
      const nextIdx = (prev.currentTeamIndex + 1) % prev.teams.length;
      if (!isCorrect) {
        const next = _nextPool(prev);
        return { ...prev, ...next, currentTeamIndex: nextIdx, phase: 'quiz', questionStartTime: Date.now() };
      }
      const elapsed = (Date.now() - (prev.questionStartTime || Date.now())) / 1000;
      const advance = elapsed < 10 ? 3 : elapsed < 20 ? 2 : 1;
      const newPositions = [...prev.boardPositions];
      newPositions[prev.currentTeamIndex] = Math.min(30, (newPositions[prev.currentTeamIndex] || 0) + advance);
      const newPos = newPositions[prev.currentTeamIndex];

      if (newPos >= 30) {
        const newTeams = [...prev.teams];
        newTeams[prev.currentTeamIndex].score = 100;
        _saveHistory(prev, newTeams);
        return { ...prev, boardPositions: newPositions, teams: newTeams, status: 'finished' };
      }

      const special = (prev.specialSquares || []).find(s => s.index === newPos);
      if (special) {
        return { ...prev, boardPositions: newPositions, phase: 'special_event', currentSpecial: special };
      }
      const next = _nextPool(prev);
      return { ...prev, ...next, boardPositions: newPositions, currentTeamIndex: nextIdx, phase: 'quiz', questionStartTime: Date.now() };
    });
  };

  const resolveSpecial = () => {
    setGameState(prev => {
      const special = prev.currentSpecial;
      const newPositions = [...prev.boardPositions];
      if (special?.type === 'star') newPositions[prev.currentTeamIndex] = Math.min(30, newPositions[prev.currentTeamIndex] + 2);
      if (special?.type === 'trap') newPositions[prev.currentTeamIndex] = Math.max(0, newPositions[prev.currentTeamIndex] - 2);
      const nextIdx = special?.type === 'stop'
        ? (prev.currentTeamIndex + 2) % prev.teams.length
        : (prev.currentTeamIndex + 1) % prev.teams.length;
      const next = _nextPool(prev);
      return { ...prev, ...next, boardPositions: newPositions, currentTeamIndex: nextIdx, phase: 'quiz', currentSpecial: null, questionStartTime: Date.now() };
    });
  };

  // ─── Bomba ──────────────────────────────────────────────────

  const answerBomba = (isCorrect) => {
    setGameState(prev => {
      if (isCorrect) {
        const nextBomb = (prev.bombTeamIndex + 1) % prev.teams.length;
        const next = _nextPool(prev);
        return { ...prev, ...next, bombTeamIndex: nextBomb, phase: 'question' };
      }
      return { ...prev, phase: 'question' };
    });
  };

  const explodeBomba = () => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      newTeams[prev.bombTeamIndex].score = Math.max(0, newTeams[prev.bombTeamIndex].score - 5);
      const next = _nextPool(prev);
      return { ...prev, ...next, teams: newTeams, phase: 'explosion', bombDuration: randomBombDuration(), bombStartTime: Date.now() };
    });
  };

  const nextBombaRound = () => {
    setGameState(prev => ({
      ...prev,
      bombTeamIndex: (prev.bombTeamIndex + 1) % prev.teams.length,
      phase: 'question',
    }));
  };

  // ─── Duelo ──────────────────────────────────────────────────

  const buzzDuelo = (teamIdx) => {
    setGameState(prev => {
      if (prev.duelBuzzedTeam !== null) return prev;
      return { ...prev, duelBuzzedTeam: teamIdx, phase: 'answering' };
    });
  };

  const answerDuelo = (teamIdx, isCorrect) => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      if (isCorrect) {
        newTeams[teamIdx].score += 10;
        const isWin = newTeams[teamIdx].score >= prev.winGoal;
        if (isWin) {
          _saveHistory(prev, newTeams);
          return { ...prev, teams: newTeams, status: 'finished' };
        }
        const next = _nextPool(prev);
        return { ...prev, teams: newTeams, duelBuzzedTeam: null, phase: 'waiting_buzz', ...next };
      } else {
        newTeams[teamIdx].score = Math.max(0, newTeams[teamIdx].score - 5);
        return { ...prev, teams: newTeams, duelBuzzedTeam: null, phase: 'steal', stealFromTeam: teamIdx };
      }
    });
  };

  const stealDuelo = (stealTeamIdx, isCorrect) => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      if (isCorrect) newTeams[stealTeamIdx].score += 7;
      const isWin = newTeams[stealTeamIdx].score >= prev.winGoal;
      if (isWin) {
        _saveHistory(prev, newTeams);
        return { ...prev, teams: newTeams, status: 'finished' };
      }
      const next = _nextPool(prev);
      return { ...prev, teams: newTeams, phase: 'waiting_buzz', duelBuzzedTeam: null, stealFromTeam: null, ...next };
    });
  };

  // ─── Cassino ────────────────────────────────────────────────
  
  const spinCassino = (currentOdds) => {
    setGameState(prev => {
      const currentTeam = prev.teams[prev.currentTeamIndex];
      if (currentTeam.score < prev.spinCost) {
        return prev;
      }
      
      const cost = prev.spinCost;
      const isWin = Math.random() * 100 < (currentOdds?.cassino ?? 20);
      const prize = isWin ? cost * 2.5 : 0; // Se ganhar, leva 2.5x
      
      const newTeams = [...prev.teams];
      newTeams[prev.currentTeamIndex].score = currentTeam.score - cost + prize;
      
      // A Casa fica com as perdas e paga os prêmios
      const newHouseBalance = (prev.houseBalance || 0) + cost - prize;
      
      const emojis = ['🍎', '🍌', '🍉'];
      let resultEmojis = [];
      if (isWin) {
        const winEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        resultEmojis = [winEmoji, winEmoji, winEmoji];
      } else {
        resultEmojis = [
          emojis[Math.floor(Math.random() * emojis.length)],
          emojis[Math.floor(Math.random() * emojis.length)],
          emojis[Math.floor(Math.random() * emojis.length)],
        ];
        if (resultEmojis[0] === resultEmojis[1] && resultEmojis[1] === resultEmojis[2]) {
          resultEmojis[2] = emojis[(emojis.indexOf(resultEmojis[2]) + 1) % emojis.length];
        }
      }

      const nextIdx = (prev.currentTeamIndex + 1) % prev.teams.length;

      return {
        ...prev,
        teams: newTeams,
        houseBalance: newHouseBalance,
        lastSpinResult: { emojis: resultEmojis, isWin, prize, teamId: currentTeam.id },
        currentTeamIndex: nextIdx,
        phase: 'spin_result'
      };
    });
  };

  const nextCassinoTurn = () => {
    setGameState(prev => ({ ...prev, phase: 'quiz', lastSpinResult: null }));
  };

  // ─── Cassino Institucional (mesma mecânica + streak de bombons) ─────

  const spinCassinoInstitucional = (currentOdds) => {
    setGameState(prev => {
      const currentTeam = prev.teams[prev.currentTeamIndex];
      if (currentTeam.score < prev.spinCost) {
        return prev;
      }

      const cost = prev.spinCost;
      const isWin = Math.random() * 100 < (currentOdds?.cassino_inst ?? 20);
      const prize = isWin ? cost * 2.5 : 0;

      const newTeams = [...prev.teams];
      const team = { ...currentTeam };
      team.score = currentTeam.score - cost + prize;

      // A cada 2 vitórias seguidas ganha 1 bombom; ao perder, devolve 1 se tiver algum guardado
      let candyAwarded = false;
      let candyReturned = false;
      const prevStreak = team.instStreak || 0;
      const prevCandies = team.candies || 0;
      if (isWin) {
        const newStreak = prevStreak + 1;
        if (newStreak % 2 === 0) {
          team.candies = prevCandies + 1;
          team.instStreak = 0;
          candyAwarded = true;
        } else {
          team.instStreak = newStreak;
        }
      } else {
        team.instStreak = 0;
        if (prevCandies > 0) {
          team.candies = prevCandies - 1;
          candyReturned = true;
        }
      }
      newTeams[prev.currentTeamIndex] = team;

      const newHouseBalance = (prev.houseBalance || 0) + cost - prize;

      const emojis = ['⛑️', '🔧', '🚛', '🦺'];
      let resultEmojis;
      if (isWin) {
        const winEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        resultEmojis = [winEmoji, winEmoji, winEmoji];
      } else {
        resultEmojis = [
          emojis[Math.floor(Math.random() * emojis.length)],
          emojis[Math.floor(Math.random() * emojis.length)],
          emojis[Math.floor(Math.random() * emojis.length)],
        ];
        if (resultEmojis[0] === resultEmojis[1] && resultEmojis[1] === resultEmojis[2]) {
          resultEmojis[2] = emojis[(emojis.indexOf(resultEmojis[2]) + 1) % emojis.length];
        }
      }

      const nextIdx = (prev.currentTeamIndex + 1) % prev.teams.length;

      return {
        ...prev,
        teams: newTeams,
        houseBalance: newHouseBalance,
        lastSpinResult: { emojis: resultEmojis, isWin, prize, teamId: currentTeam.id, candyAwarded, candyReturned },
        currentTeamIndex: nextIdx,
        phase: 'spin_result'
      };
    });
  };

  const endBetsSession = () => {
    setGameState(prev => {
      _saveHistory(prev, prev.teams);
      return { status: 'idle' };
    });
  };

  // ─── Utilitários Financeiros (Crash, Lootbox, Roleta) ────────

  const updateTeamScore = (teamIndex, delta) => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      newTeams[teamIndex].score += delta;
      return { ...prev, teams: newTeams };
    });
  };

  const addHouseBalance = (amount) => {
    setGameState(prev => ({
      ...prev,
      houseBalance: (prev.houseBalance || 0) + amount
    }));
  };

  // ─── Compartilhado ──────────────────────────────────────────

  const nextTurn = () => {
    setGameState(prev => {
      if (prev.status === 'finished') return prev;
      const nextIdx = (prev.currentTeamIndex + 1) % prev.teams.length;
      const next = _nextPool(prev);
      return { ...prev, ...next, currentTeamIndex: nextIdx, phase: 'quiz', forcaGuessed: [], forcaWrong: [], removedOptions: [] };
    });
  };

  const quitGame = () => {
    setGameState({ status: 'idle' });
  };

  return {
    gameState,
    startGame,
    togglePause,
    answerQuiz,
    completeWordSearch,
    failWordSearch,
    buzzTeam,
    answerQuizTempo,
    skipQuizTempo,
    answerForcaQuiz,
    guessForcaLetter,
    answerEliminacao,
    activateLifeline,
    resumeFromAskTeam,
    nextEliminacaoRound,
    answerCorrida,
    resolveSpecial,
    answerBomba,
    explodeBomba,
    nextBombaRound,
    buzzDuelo,
    answerDuelo,
    stealDuelo,
    spinCassino,
    nextCassinoTurn,
    spinCassinoInstitucional,
    endBetsSession,
    updateTeamScore,
    addHouseBalance,
    nextTurn,
    quitGame,
  };
}
