import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAppContext } from '../../context/AppContext';
import { GameLayout, COLORS, HEX_COLORS } from './GameLayout';
import BoardGame, { SPECIAL_INFO } from '../../components/BoardGame';
import TimerDisplay from '../../components/TimerDisplay';

export default function CorridaScreen() {
  const { gameState, answerCorrida, resolveSpecial } = useGame();
  const { questions } = useAppContext();
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [timerActive, setTimerActive] = useState(true);

  const currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);
  const phase = gameState.phase; // 'quiz' | 'special_event'
  const positions = gameState.boardPositions || gameState.teams.map(() => 0);
  const special = gameState.currentSpecial;
  const activeColor = HEX_COLORS[gameState.currentTeamIndex % 4];

  // Bug 6 fix: state reset removed — GameScreen passes key={currentQuestionId}
  // so this component remounts on each new question, resetting local state.

  const handleSelect = (idx) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    setTimerActive(false);
    const isCorrect = idx === currentQuestion.correct;
    setTimeout(() => answerCorrida(isCorrect), 1400);
  };

  const handleTimeout = () => {
    setTimerActive(false);
    answerCorrida(false);
  };

  const rightPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {phase === 'quiz' && (
        <div className="glass" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>TEMPO</div>
          <TimerDisplay active={timerActive} duration={20} onTimeout={handleTimeout} />
        </div>
      )}
      <div className="glass" style={{ padding: '14px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '1px' }}>POSIÇÕES</div>
        {gameState.teams.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ color: COLORS[i % 4], fontWeight: '700', fontSize: '0.85rem' }}>{t.name}</span>
            <span style={{ fontWeight: '900', color: COLORS[i % 4] }}>{positions[i]}/30</span>
          </div>
        ))}
      </div>
      <div className="glass" style={{ padding: '12px', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: '1.6' }}>
        ⭐ +2 casas · 💣 -2 casas<br/>🔄 Bônus · 🛑 Perde turno<br/><br/>
        ⚡ &lt;10s → 3 casas<br/>⏱ 10-20s → 2 casas<br/>🐢 &gt;20s → 1 casa
      </div>
    </div>
  );

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={rightPanel}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>

        {/* Tabuleiro */}
        <div className="glass" style={{ padding: '12px', flex: '0 0 auto' }}>
          <BoardGame positions={positions} teams={gameState.teams} specialSquares={gameState.specialSquares || []} totalSquares={30} />
        </div>

        {/* Casa especial */}
        {phase === 'special_event' && special && (
          <div className="glass animate-scale" style={{
            padding: '30px', textAlign: 'center', flex: 1,
            display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center',
            border: `2px solid ${SPECIAL_INFO[special.type]?.color || '#fff'}`,
            boxShadow: `0 0 30px ${SPECIAL_INFO[special.type]?.color || '#fff'}40`,
          }}>
            <div style={{ fontSize: '3rem' }}>{SPECIAL_INFO[special.type]?.icon}</div>
            <h2 style={{ color: SPECIAL_INFO[special.type]?.color }}>{SPECIAL_INFO[special.type]?.label}</h2>
            <p>{SPECIAL_INFO[special.type]?.desc}</p>
            <button className="btn btn-primary" onClick={resolveSpecial}>Continuar →</button>
          </div>
        )}

        {/* Quiz */}
        {phase === 'quiz' && currentQuestion && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
            <div className="glass" style={{ padding: '20px', borderTop: `3px solid ${activeColor}` }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '2px' }}>🏃 CORRIDA · {gameState.teams[gameState.currentTeamIndex]?.name}</div>
              <h2 style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.3rem)', lineHeight: '1.5' }}>{currentQuestion.q}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrect = idx === currentQuestion.correct;
                const showReveal = selectedIdx !== null;
                let bg = `${activeColor}11`, border = `${activeColor}33`, color = 'var(--text)';
                if (showReveal) {
                  if (isCorrect) { bg = 'rgba(57,255,20,0.2)'; border = '#39FF14'; color = '#39FF14'; }
                  else if (isSelected) { bg = 'rgba(255,51,85,0.2)'; border = '#FF3355'; color = '#FF3355'; }
                  else { bg = 'rgba(0,0,0,0.2)'; border = 'transparent'; color = 'var(--muted)'; }
                }
                return (
                  <button key={idx} onClick={() => handleSelect(idx)} disabled={selectedIdx !== null}
                    style={{ background: bg, border: `2px solid ${border}`, color, borderRadius: '10px', padding: '12px', fontFamily: 'var(--font)', fontSize: '0.9rem', fontWeight: '600', textAlign: 'left', cursor: selectedIdx !== null ? 'default' : 'pointer', transition: 'all 0.2s' }}>
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
