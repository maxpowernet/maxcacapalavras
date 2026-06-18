import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAppContext } from '../../context/AppContext';
import { GameLayout, COLORS, HEX_COLORS } from './GameLayout';
import TimerDisplay from '../../components/TimerDisplay';

export default function DueloScreen() {
  const { gameState, buzzDuelo, answerDuelo, stealDuelo } = useGame();
  const { questions } = useAppContext();
  const [stealAnswered, setStealAnswered] = useState(false);
  const [stealSelected, setStealSelected] = useState(null);

  const currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);
  const phase = gameState.phase; // 'waiting_buzz' | 'answering' | 'steal'
  const buzzedIdx = gameState.duelBuzzedTeam;
  const stealFromTeam = gameState.stealFromTeam;

  // Determine which team can steal (the other team in the pair)
  const getStealTeamIdx = () => {
    const pairs = gameState.dueloPairs || [[0, 1]];
    const pairIdx = gameState.currentDuelPairIdx || 0;
    const pair = pairs[pairIdx] || [0, 1];
    return pair.find(i => i !== stealFromTeam) ?? (stealFromTeam === 0 ? 1 : 0);
  };

  const stealTeamIdx = getStealTeamIdx();

  // Bug 6 fix: state reset removed — GameScreen passes key={currentQuestionId}
  // so this component remounts on each new question, resetting local state.

  const handleBuzz = (teamIdx) => {
    if (phase !== 'waiting_buzz') return;
    buzzDuelo(teamIdx);
  };

  const handleAnswer = (isCorrect) => {
    answerDuelo(buzzedIdx, isCorrect);
  };

  const handleSteal = (isCorrect) => {
    if (stealAnswered) return;
    setStealAnswered(true);
    setStealSelected(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => stealDuelo(stealTeamIdx, isCorrect), 1400);
  };

  if (!currentQuestion) return null;

  const rightPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {phase === 'answering' && buzzedIdx !== null && (
        <div className="glass animate-slide" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>Respondendo:</div>
          <div style={{ fontWeight: '800', color: COLORS[buzzedIdx % 4], fontSize: '1.1rem' }}>
            {gameState.teams[buzzedIdx]?.name}
          </div>
          <div style={{ marginTop: '8px' }}>
            <TimerDisplay active duration={15} onTimeout={() => handleAnswer(false)} />
          </div>
        </div>
      )}
      {phase === 'steal' && (
        <div className="glass animate-slide" style={{ padding: '16px', textAlign: 'center', border: `2px solid ${COLORS[stealTeamIdx % 4]}`, boxShadow: `0 0 20px ${COLORS[stealTeamIdx % 4]}40` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>Roubo:</div>
          <div style={{ fontWeight: '800', color: COLORS[stealTeamIdx % 4] }}>
            {gameState.teams[stealTeamIdx]?.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>+7 pts se acertar</div>
          <div style={{ marginTop: '8px' }}>
            <TimerDisplay active duration={10} onTimeout={() => handleSteal(false)} />
          </div>
        </div>
      )}
      <div className="glass" style={{ padding: '12px', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: '1.8' }}>
        🔔 Buzzer → tenta responder<br/>
        ✅ Acertou → +10 pts<br/>
        ❌ Errou → -5 pts<br/>
        🔄 Adversário pode roubar → +7 pts
      </div>
    </div>
  );

  // Determina os dois times do duelo atual
  const pairs = gameState.dueloPairs || [[0, 1]];
  const pairIdx = gameState.currentDuelPairIdx || 0;
  const currentPair = pairs[pairIdx] || [0, 1];

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={rightPanel}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>

        {/* Pergunta */}
        <div className="glass animate-fade" style={{ padding: '24px', textAlign: 'center', borderTop: '3px solid var(--t4)', boxShadow: '0 0 20px rgba(255,189,51,0.15)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--t4)', letterSpacing: '2px', marginBottom: '10px', fontWeight: '700' }}>⚔️ MODO DUELO</div>
          <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', lineHeight: '1.5' }}>{currentQuestion.q}</h2>
        </div>

        {/* Fase: Waiting Buzz — dois grandes botões */}
        {phase === 'waiting_buzz' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {currentPair.map((teamIdx) => {
              const t = gameState.teams[teamIdx];
              if (!t) return null;
              return (
                <button
                  key={teamIdx}
                  onClick={() => handleBuzz(teamIdx)}
                  style={{
                    background: `${HEX_COLORS[teamIdx % 4]}15`,
                    border: `3px solid ${HEX_COLORS[teamIdx % 4]}`,
                    borderRadius: 'var(--radius)',
                    color: HEX_COLORS[teamIdx % 4],
                    fontFamily: 'var(--font)',
                    fontWeight: '900',
                    fontSize: 'clamp(1.2rem, 3vw, 2rem)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: `0 0 24px ${HEX_COLORS[teamIdx % 4]}30`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${HEX_COLORS[teamIdx % 4]}30`; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${HEX_COLORS[teamIdx % 4]}15`; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span style={{ fontSize: '3rem' }}>🔔</span>
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Fase: Respondendo */}
        {phase === 'answering' && buzzedIdx !== null && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx === currentQuestion.correct)}
                style={{
                  background: `${HEX_COLORS[buzzedIdx % 4]}11`,
                  border: `2px solid ${HEX_COLORS[buzzedIdx % 4]}44`,
                  borderRadius: '12px', color: 'var(--text)',
                  fontFamily: 'var(--font)', fontSize: '0.95rem', fontWeight: '600',
                  padding: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${HEX_COLORS[buzzedIdx % 4]}30`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${HEX_COLORS[buzzedIdx % 4]}11`; e.currentTarget.style.transform = 'none'; }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Fase: Roubo */}
        {phase === 'steal' && (
          <div className="animate-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="glass" style={{ padding: '16px', textAlign: 'center', borderTop: `3px solid ${COLORS[stealTeamIdx % 4]}` }}>
              <span style={{ fontSize: '0.85rem', color: COLORS[stealTeamIdx % 4], fontWeight: '700' }}>
                🔄 {gameState.teams[stealTeamIdx]?.name} pode roubar!
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = stealSelected !== null;
                const isCorrect = idx === currentQuestion.correct;
                let bg = `${HEX_COLORS[stealTeamIdx % 4]}11`, border = `${HEX_COLORS[stealTeamIdx % 4]}44`, color = 'var(--text)';
                if (isSelected) {
                  if (isCorrect) { bg = 'rgba(57,255,20,0.2)'; border = '#39FF14'; color = '#39FF14'; }
                  else { bg = 'rgba(0,0,0,0.2)'; border = 'transparent'; color = 'var(--muted)'; }
                }
                return (
                  <button key={idx} onClick={() => !isSelected && handleSteal(idx === currentQuestion.correct)} disabled={isSelected}
                    style={{ background: bg, border: `2px solid ${border}`, color, borderRadius: '12px', padding: '14px', fontFamily: 'var(--font)', fontSize: '0.9rem', fontWeight: '600', textAlign: 'left', cursor: isSelected ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
