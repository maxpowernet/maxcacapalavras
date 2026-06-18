import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAppContext } from '../../context/AppContext';
import { GameLayout, HEX_COLORS } from './GameLayout';

export default function BombaScreen() {
  const { gameState, answerBomba, explodeBomba, nextBombaRound } = useGame();
  const { questions } = useAppContext();
  const [selectedIdx, setSelectedIdx] = useState(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const [pulse, setPulse] = useState(false);

  // Bug 6 fix: removed local `phase` state — it was a mirror of gameState.phase
  // and required synchronous setState calls inside effects to keep in sync.
  // We now use gameState.phase directly everywhere in the render.
  // GameScreen also passes key={`${gameState.phase}-${currentQuestionId}`} so
  // the component remounts when the question changes, resetting selectedIdx.

  const currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);
  const bombTeam = gameState.teams[gameState.bombTeamIndex] || gameState.teams[0];
  const bombColor = HEX_COLORS[gameState.bombTeamIndex % 4];

  // Start/restart the hidden bomb timer whenever we enter the 'question' phase.
  // No setState calls here — only refs, setTimeout, and setInterval.
  useEffect(() => {
    if (gameState.phase !== 'question') return;
    startRef.current = Date.now();
    clearTimeout(timerRef.current);

    const duration = (gameState.bombDuration || 20) * 1000;
    timerRef.current = setTimeout(() => {
      explodeBomba();
    }, duration);

    // Pulse animation as the timer approaches the end
    const pulseInterval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const pct = elapsed / (gameState.bombDuration || 20);
      setPulse(pct > 0.7);
    }, 500);

    return () => { clearTimeout(timerRef.current); clearInterval(pulseInterval); };
  }, [gameState.phase, gameState.bombDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (idx) => {
    if (selectedIdx !== null) return;
    clearTimeout(timerRef.current);
    setSelectedIdx(idx);
    const isCorrect = idx === currentQuestion.correct;
    setTimeout(() => answerBomba(isCorrect), 1400);
  };

  if (!currentQuestion && gameState.phase !== 'explosion') return null;

  const rightPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass" style={{ padding: '16px', textAlign: 'center', border: `2px solid ${bombColor}`, boxShadow: `0 0 20px ${bombColor}40` }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '4px' }}>BOMBA COM:</div>
        <div style={{ fontWeight: '900', fontSize: '1.2rem', color: bombColor }}>{bombTeam.name}</div>
        <div style={{ fontSize: '2rem', marginTop: '8px', animation: pulse ? 'pulse 0.4s infinite alternate' : 'none' }}>💣</div>
      </div>
      <div className="glass" style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: '1.8' }}>
        ✅ Certo → passa a bomba<br/>
        ❌ Errado → bomba fica<br/>
        💥 Explode → -5 pts
      </div>
    </div>
  );

  return (
    <GameLayout currentTeamIndex={gameState.bombTeamIndex} teams={gameState.teams} rightPanel={rightPanel}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>

        {/* Explosão */}
        {gameState.phase === 'explosion' && (
          <div className="glass animate-scale" style={{
            padding: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px',
            border: `2px solid #FF3355`, boxShadow: '0 0 50px rgba(255,51,85,0.5)',
          }}>
            <div style={{ fontSize: '5rem', animation: 'shake 0.5s ease 3' }}>💥</div>
            <h2 style={{ color: '#FF3355', fontSize: '2.5rem' }}>KABOOM!</h2>
            <p style={{ fontSize: '1.1rem' }}>
              <strong style={{ color: bombColor }}>{bombTeam.name}</strong> perdeu 5 pontos!
            </p>
            <button className="btn btn-primary btn-lg" onClick={nextBombaRound}>Nova Rodada →</button>
          </div>
        )}

        {/* Quiz com a bomba */}
        {gameState.phase === 'question' && currentQuestion && (
          <>
            <div className="glass" style={{
              padding: '24px',
              borderTop: `3px solid ${bombColor}`,
              boxShadow: `0 0 20px ${bombColor}20`,
              animation: pulse ? 'border-pulse 0.4s infinite alternate' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.5rem', animation: pulse ? 'shake 0.3s infinite' : 'none' }}>💣</span>
                <span style={{ fontSize: '0.8rem', color: bombColor, fontWeight: '700', letterSpacing: '2px' }}>
                  BOMBA RELÓGIO · {bombTeam.name}
                </span>
              </div>
              <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', lineHeight: '1.5' }}>{currentQuestion.q}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrect = idx === currentQuestion.correct;
                const showReveal = selectedIdx !== null;
                let bg = `${bombColor}11`, border = `${bombColor}33`, color = 'var(--text)';
                if (showReveal) {
                  if (isCorrect) { bg = 'rgba(57,255,20,0.2)'; border = '#39FF14'; color = '#39FF14'; }
                  else if (isSelected) { bg = 'rgba(255,51,85,0.2)'; border = '#FF3355'; color = '#FF3355'; }
                  else { bg = 'rgba(0,0,0,0.2)'; border = 'transparent'; color = 'var(--muted)'; }
                }
                return (
                  <button key={idx} onClick={() => handleSelect(idx)} disabled={selectedIdx !== null}
                    style={{ background: bg, border: `2px solid ${border}`, color, borderRadius: '12px', padding: '16px', fontFamily: 'var(--font)', fontSize: '0.95rem', fontWeight: '600', textAlign: 'left', cursor: selectedIdx !== null ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes shake { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }`}</style>
    </GameLayout>
  );
}
