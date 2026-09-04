import React, { useMemo } from 'react';
import { useGame } from '../hooks/useGame';
import { useAppContext } from '../context/AppContext';
import { generateGrid } from '../utils/wordGrid';

import BrandLogo from '../components/BrandLogo';
import PlayerCard from '../components/PlayerCard';
import Scoreboard from '../components/Scoreboard';
import TimerDisplay from '../components/TimerDisplay';
import WordGrid from '../components/WordGrid';
import QuizOverlay from '../components/QuizOverlay';
import PauseOverlay from '../components/PauseOverlay';
import FullscreenButton from '../components/FullscreenButton';

import QuizTempoScreen from './game-modes/QuizTempoScreen';
import ForcaScreen from './game-modes/ForcaScreen';
import EliminacaoScreen from './game-modes/EliminacaoScreen';
import CorridaScreen from './game-modes/CorridaScreen';
import BombaScreen from './game-modes/BombaScreen';
import DueloScreen from './game-modes/DueloScreen';
import CassinoScreen from './game-modes/CassinoScreen';
import CassinoInstitucionalScreen from './game-modes/CassinoInstitucionalScreen';
import CrashScreen from './game-modes/CrashScreen';
import LootboxScreen from './game-modes/LootboxScreen';
import RoletaScreen from './game-modes/RoletaScreen';

const COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];

export default function GameScreen() {
  const { gameState, togglePause, quitGame } = useGame();
  const { questions } = useAppContext();

  if (gameState.paused) return <PauseOverlay />;

  const mode = gameState.gameMode || 'cacapalavras';

  // Safety net: if the current question ID can't be found in the loaded
  // questions list (stale localStorage, corrupt data, etc.) show a recovery
  // screen rather than a silent blank page.
  // Bets modes (cassino, crash, lootbox, roleta) don't use questions — skip the check.
  const BETS_MODES = ['cassino', 'cassino_inst', 'crash', 'lootbox', 'roleta'];
  const needsQuestion = !BETS_MODES.includes(mode) && mode !== 'bomba';
  const questionExists = questions.some(q => q.id === gameState.currentQuestionId);
  if (needsQuestion && !questionExists) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2>Pergunta não encontrada</h2>
        <p style={{ color: 'var(--muted)', maxWidth: '420px' }}>
          Os dados do jogo estão desatualizados ou corrompidos. Por favor, inicie uma nova partida.
        </p>
        <button className="btn btn-primary" onClick={quitGame}>Voltar ao início</button>
      </div>
    );
  }

  // Bug 6 fix: pass key={currentQuestionId} (and eliminacaoLevel for Eliminação)
  // so React fully remounts each screen when the question changes. This resets
  // local UI state (selectedIdx, timerActive, etc.) automatically, eliminating
  // the need for synchronous setState calls inside useEffect hooks.
  let screen;
  if (mode === 'quiz_tempo') screen = <QuizTempoScreen key={gameState.currentQuestionId} />;
  else if (mode === 'forca')      screen = <ForcaScreen key={gameState.currentQuestionId} />;
  else if (mode === 'eliminacao') screen = <EliminacaoScreen key={`${gameState.eliminacaoLevel ?? 0}-${gameState.currentQuestionId}`} />;
  else if (mode === 'corrida')    screen = <CorridaScreen key={gameState.currentQuestionId} />;
  else if (mode === 'bomba')      screen = <BombaScreen key={`${gameState.phase}-${gameState.currentQuestionId}`} />;
  else if (mode === 'duelo')      screen = <DueloScreen key={gameState.currentQuestionId} />;
  else if (mode === 'cassino')    screen = <CassinoScreen key={gameState.currentTeamIndex} />;
  else if (mode === 'cassino_inst') screen = <CassinoInstitucionalScreen key={gameState.currentTeamIndex} />;
  else if (mode === 'crash')      screen = <CrashScreen key={gameState.currentTeamIndex} />;
  else if (mode === 'lootbox')    screen = <LootboxScreen key={gameState.currentTeamIndex} />;
  else if (mode === 'roleta')     screen = <RoletaScreen key={gameState.currentTeamIndex} />;
  // key faltante: sem ela, o QuizOverlay não remonta ao trocar de pergunta após uma resposta errada
  else screen = <CacaPalavrasScreen key={gameState.currentQuestionId} togglePause={togglePause} />;

  return <>{screen}<FullscreenButton /></>;
}

// ─── Modo Caça-Palavras (original) ───────────────────────────────────────────

function CacaPalavrasScreen({ togglePause }) {
  const { gameState, answerQuiz, completeWordSearch, nextTurn } = useGame();
  const { questions } = useAppContext();

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const activeColor = COLORS[gameState.currentTeamIndex % 4];
  const currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);

  const { grid, answerCoords } = useMemo(() => {
    if (!currentQuestion) return { grid: [], answerCoords: [] };
    return generateGrid(currentQuestion.word);
  }, [currentQuestion?.word]);

  if (!currentQuestion) return null;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', padding: 'clamp(10px, 2vh, 20px)' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '1600px', margin: '0 auto', gap: '20px', aspectRatio: '16/9' }}>

        {/* Left Sidebar */}
        <aside style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ display: 'flex', justifyContent: 'center' }}>
            <BrandLogo interactive onClick={togglePause} />
          </div>
          <h2 style={{ fontSize: '1.1rem', letterSpacing: '2px', color: 'var(--muted)', textAlign: 'center' }}>EQUIPES</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
            {gameState.teams.map((t, idx) => (
              <PlayerCard key={t.id} team={t} isActive={idx === gameState.currentTeamIndex} />
            ))}
          </div>
        </aside>

        {/* Center */}
        <main style={{ flex: '2', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxHeight: '100%', aspectRatio: '1' }}>
            {gameState.phase === 'quiz' && (
              <QuizOverlay question={currentQuestion} activeTeamId={gameState.currentTeamIndex} onAnswer={answerQuiz} />
            )}
            {gameState.phase === 'turn_transition' && (
              <div className="animate-fade" style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius)', gap: '20px'
              }}>
                <h2 style={{ fontSize: '2rem' }}>Passando a vez...</h2>
                <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                <button className="btn btn-primary" onClick={nextTurn}>Próximo Turno →</button>
              </div>
            )}
            {gameState.phase === 'wordsearch' && (
              <WordGridWrapper
                grid={grid} answerCoords={answerCoords} teamIdx={gameState.currentTeamIndex}
                onSuccess={(timeLeft) => completeWordSearch(timeLeft)}
                onFail={() => nextTurn()}
              />
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Scoreboard teams={gameState.teams} />
          <div className="glass" style={{ padding: '20px', textAlign: 'center', background: activeColor, boxShadow: `0 0 20px ${activeColor}40` }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
              Turno de:
            </span>
            <h2 style={{ fontSize: '1.8rem', color: '#000' }}>{currentTeam.name}</h2>
          </div>
          {gameState.phase === 'wordsearch' && (
            <div className="glass animate-slide" style={{ padding: '20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
              <h3>Encontre a palavra:</h3>
              <p style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '4px', color: 'var(--text)', wordBreak: 'break-all' }}>
                {currentQuestion.word}
              </p>
            </div>
          )}
        </aside>

      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function WordGridWrapper({ grid, answerCoords, teamIdx, onSuccess, onFail }) {
  const [timeLeft, setTimeLeft] = React.useState(30);
  const [isActive, setIsActive] = React.useState(true);
  // Bug 5 fix: guard against double-completion (timer fires at same instant as
  // a wrong-selection animation finishes), which would call nextTurn() twice
  // and skip a team's turn.
  const completedRef = React.useRef(false);

  const handleComplete = React.useCallback((success) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsActive(false);
    if (success) onSuccess(timeLeft);
    else onFail();
  }, [onSuccess, onFail, timeLeft]);

  return (
    <>
      <WordGrid
        grid={grid} answerCoords={answerCoords} activeTeamId={teamIdx}
        onComplete={handleComplete}
      />
      <div style={{ position: 'fixed', right: 'clamp(10px, 2vw, 40px)', bottom: '40px', width: 'clamp(250px, 20vw, 350px)', zIndex: 100 }}>
        <TimerDisplay
          active={isActive} duration={30}
          onTimeout={() => handleComplete(false)}
          onTick={setTimeLeft}
        />
      </div>
    </>
  );
}
