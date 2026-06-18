import { useState, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAppContext } from '../../context/AppContext';
import { GameLayout, HEX_COLORS } from './GameLayout';
import TimerDisplay from '../../components/TimerDisplay';

const POINTS = [2, 5, 10, 20, 40];
const LEVEL_NAMES = ['Nível 1', 'Nível 2', 'Nível 3', 'Nível 4', 'Nível 5'];

export default function EliminacaoScreen() {
  const { gameState, answerEliminacao, activateLifeline, resumeFromAskTeam, nextEliminacaoRound } = useGame();
  const { questions } = useAppContext();
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [timerActive, setTimerActive] = useState(true);
  const [askTeamTimeLeft, setAskTeamTimeLeft] = useState(15);

  const currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);
  const phase = gameState.phase; // 'quiz' | 'reveal' | 'eliminated' | 'ask_team_pause'
  const level = gameState.eliminacaoLevel || 0;
  const accumulated = gameState.roundAccumulated || 0;
  const lifelines = gameState.lifelines || {};
  const removedOptions = gameState.removedOptions || [];
  const activeColor = HEX_COLORS[gameState.currentTeamIndex % 4];

  // Bug 6 fix: state reset removed — GameScreen now passes
  // key={`${level}-${currentQuestionId}`} so this component remounts
  // automatically whenever the question or level changes, resetting
  // all local state without any synchronous setState inside useEffect.

  // askTeamTimeLeft initialises to 15 and is only ever used once (the lifeline
  // is consumed after the first activation), so no synchronous reset is needed.
  useEffect(() => {
    if (phase !== 'ask_team_pause') return;
    const t = setInterval(() => {
      setAskTeamTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); resumeFromAskTeam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const handleSelect = (idx) => {
    if (selectedIdx !== null || phase !== 'quiz') return;
    setSelectedIdx(idx);
    setTimerActive(false);
    const isCorrect = idx === currentQuestion.correct;
    setTimeout(() => answerEliminacao(isCorrect), 1500);
  };

  const handleTimeout = () => {
    setTimerActive(false);
    answerEliminacao(false);
  };

  if (!currentQuestion && phase !== 'eliminated') return null;

  // Indicadores de nível
  const levelBar = (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
      {POINTS.map((pts, i) => (
        <div key={i} style={{
          padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
          background: i < level ? `${activeColor}33` : i === level ? activeColor : 'rgba(255,255,255,0.07)',
          color: i === level ? '#000' : i < level ? activeColor : 'var(--muted)',
          border: `1px solid ${i <= level ? activeColor : 'transparent'}`,
        }}>
          {LEVEL_NAMES[i]}<br />
          <span style={{ fontWeight: '900' }}>+{pts}pts</span>
        </div>
      ))}
    </div>
  );

  const rightPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass" style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '1px' }}>ACUMULADO</div>
        <div style={{ fontSize: '2rem', fontWeight: '900', color: activeColor }}>{accumulated} pts</div>
      </div>
      {phase === 'quiz' && (
        <div className="glass" style={{ padding: '12px', textAlign: 'center' }}>
          <TimerDisplay active={timerActive} duration={30} onTimeout={handleTimeout} />
        </div>
      )}
      <div className="glass" style={{ padding: '14px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '10px', letterSpacing: '1px' }}>AJUDAS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { key: 'fiftyfifty', label: '🃏 50/50', desc: 'Remove 2 erradas' },
            { key: 'skip', label: '⏩ Pular', desc: 'Descarta sem pontuar' },
            { key: 'askTeam', label: '👥 Consultar', desc: 'Pausa 15s' },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => activateLifeline(key)}
              disabled={!lifelines[key] || phase !== 'quiz'}
              style={{
                background: lifelines[key] ? `${activeColor}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${lifelines[key] ? activeColor : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px', padding: '8px 10px', cursor: lifelines[key] ? 'pointer' : 'not-allowed',
                color: lifelines[key] ? activeColor : 'var(--muted)', fontFamily: 'var(--font)',
                opacity: lifelines[key] ? 1 : 0.5, textAlign: 'left', fontSize: '0.85rem', fontWeight: '600',
              }}
            >
              {label}<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--muted)' }}>{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={rightPanel}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>

        {/* Nível */}
        {levelBar}

        {/* Ask Team Pause */}
        {phase === 'ask_team_pause' && (
          <div className="glass animate-scale" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '3rem' }}>👥</div>
            <h2>Consultando a Equipe</h2>
            <div style={{ fontSize: '3rem', fontWeight: '800', color: activeColor }}>{askTeamTimeLeft}s</div>
            <button className="btn btn-primary" onClick={resumeFromAskTeam}>Continuar</button>
          </div>
        )}

        {/* Eliminado */}
        {phase === 'eliminated' && (
          <div className="glass animate-scale" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '3rem' }}>💥</div>
            <h2 style={{ color: '#FF3355' }}>Eliminado!</h2>
            <p>Resposta errada. Sem pontos esta rodada.</p>
            <button className="btn btn-primary" onClick={nextEliminacaoRound}>Próxima Equipe →</button>
          </div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && (
          <div className="glass animate-fade" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <h3>Correto! +{POINTS[Math.max(0, level - 1)]} pts</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              Acumulado: <strong style={{ color: activeColor }}>{accumulated} pts</strong>
            </p>
            <button className="btn btn-primary" onClick={nextEliminacaoRound}>
              {level >= 5 ? 'Próxima Equipe →' : 'Próxima Pergunta →'}
            </button>
          </div>
        )}

        {/* Quiz */}
        {phase === 'quiz' && currentQuestion && (
          <>
            <div className="glass animate-fade" style={{
              padding: '24px', borderTop: `3px solid ${activeColor}`, boxShadow: `0 0 20px ${activeColor}20`,
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '2px' }}>
                🧩 ELIMINAÇÃO · {LEVEL_NAMES[level]} · +{POINTS[level]}pts
              </div>
              <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', lineHeight: '1.5' }}>{currentQuestion.q}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {currentQuestion.options.map((opt, idx) => {
                const isRemoved = removedOptions.includes(idx);
                const isSelected = selectedIdx === idx;
                const isCorrect = idx === currentQuestion.correct;
                const showReveal = selectedIdx !== null;

                let bg = `${activeColor}11`, border = `${activeColor}33`, color = `var(--text)`;
                if (showReveal) {
                  if (isCorrect) { bg = 'rgba(57,255,20,0.2)'; border = '#39FF14'; color = '#39FF14'; }
                  else if (isSelected) { bg = 'rgba(255,51,85,0.2)'; border = '#FF3355'; color = '#FF3355'; }
                  else { bg = 'rgba(255,255,255,0.03)'; border = 'transparent'; color = 'var(--muted)'; }
                }

                if (isRemoved) return (
                  <div key={idx} style={{ height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }} />
                );

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={selectedIdx !== null}
                    style={{
                      background: bg, border: `2px solid ${border}`, color,
                      padding: '14px 16px', borderRadius: '12px',
                      fontFamily: 'var(--font)', fontSize: '0.95rem', fontWeight: '600',
                      textAlign: 'left', cursor: selectedIdx !== null ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </GameLayout>
  );
}
