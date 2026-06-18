import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAppContext } from '../../context/AppContext';
import { GameLayout, COLORS, HEX_COLORS } from './GameLayout';
import TimerDisplay from '../../components/TimerDisplay';

export default function QuizTempoScreen() {
  const { gameState, buzzTeam, answerQuizTempo, skipQuizTempo } = useGame();
  const { questions } = useAppContext();
  const [timerActive, setTimerActive] = useState(true);

  const currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);
  const phase = gameState.phase; // 'question' | 'answering'
  const buzzedIdx = gameState.buzzedTeamIdx;

  const handleBuzz = (idx) => {
    if (phase !== 'question') return;
    buzzTeam(idx);
  };

  const handleAnswer = (isCorrect) => {
    answerQuizTempo(buzzedIdx, isCorrect);
    setTimerActive(false);
    setTimeout(() => setTimerActive(true), 100);
  };

  const handleSkip = () => {
    skipQuizTempo();
    setTimerActive(false);
    setTimeout(() => setTimerActive(true), 100);
  };

  const handleTimeout = () => {
    skipQuizTempo();
    setTimeout(() => setTimerActive(true), 100);
  };

  if (!currentQuestion) return null;

  const rightPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass" style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '1px' }}>TEMPO</div>
        <TimerDisplay active={timerActive} duration={30} onTimeout={handleTimeout} />
      </div>
      {phase === 'answering' && buzzedIdx !== null && (
        <div className="glass animate-slide" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>Respondendo:</div>
          <div style={{ fontWeight: '800', color: COLORS[buzzedIdx % 4] }}>{gameState.teams[buzzedIdx]?.name}</div>
        </div>
      )}
      <button className="btn btn-secondary btn-sm" onClick={handleSkip} style={{ marginTop: 'auto' }}>
        Pular Pergunta
      </button>
    </div>
  );

  return (
    <GameLayout
      currentTeamIndex={gameState.currentTeamIndex}
      teams={gameState.teams}
      rightPanel={rightPanel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>

        {/* Pergunta */}
        <div className="glass animate-fade" style={{
          padding: '30px', textAlign: 'center',
          borderTop: `3px solid var(--t2)`,
          boxShadow: '0 0 30px rgba(255,0,122,0.15)',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--t2)', letterSpacing: '2px', marginBottom: '12px', fontWeight: '700' }}>⚡ QUIZ POR TEMPO</div>
          <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.6rem)', lineHeight: '1.4' }}>{currentQuestion.q}</h2>
        </div>

        {/* Buzzers das equipes — aparecem quando está na fase question */}
        {phase === 'question' && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gameState.teams.length}, 1fr)`, gap: '12px', flex: 1 }}>
            {gameState.teams.map((t, idx) => {
              const alreadyBuzzed = (gameState.buzzOrder || []).includes(idx);
              return (
                <button
                  key={t.id}
                  onClick={() => handleBuzz(idx)}
                  disabled={alreadyBuzzed}
                  style={{
                    background: alreadyBuzzed ? 'rgba(255,255,255,0.05)' : `${HEX_COLORS[idx % 4]}22`,
                    border: `3px solid ${alreadyBuzzed ? 'rgba(255,255,255,0.1)' : HEX_COLORS[idx % 4]}`,
                    borderRadius: 'var(--radius)',
                    color: alreadyBuzzed ? 'var(--muted)' : HEX_COLORS[idx % 4],
                    fontFamily: 'var(--font)',
                    fontWeight: '900',
                    fontSize: 'clamp(1rem, 2.5vw, 2rem)',
                    cursor: alreadyBuzzed ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: alreadyBuzzed ? 0.4 : 1,
                    boxShadow: alreadyBuzzed ? 'none' : `0 0 20px ${HEX_COLORS[idx % 4]}30`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>🔔</span>
                  <span>{t.name}</span>
                  {alreadyBuzzed && <span style={{ fontSize: '0.7rem' }}>Já buzzou</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Resposta — quando uma equipe buzzou */}
        {phase === 'answering' && buzzedIdx !== null && (
          <div className="animate-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx === currentQuestion.correct)}
                  style={{
                    background: `${HEX_COLORS[buzzedIdx % 4]}11`,
                    border: `2px solid ${HEX_COLORS[buzzedIdx % 4]}44`,
                    borderRadius: '12px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    padding: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${HEX_COLORS[buzzedIdx % 4]}33`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `${HEX_COLORS[buzzedIdx % 4]}11`;
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
