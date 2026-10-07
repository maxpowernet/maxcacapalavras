import { useState, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { GameLayout } from './GameLayout';
import { useBetsOdds } from '../../hooks/useBetsOdds';
import { institutionalQuestions } from '../../data/institutionalQuestions';
import bombomImg from '../../assets/bombom.png';

const EMOJIS = ['⛑️', '🔧', '🚛', '🦺'];

function randomQuestion() {
  return institutionalQuestions[Math.floor(Math.random() * institutionalQuestions.length)];
}

export default function CassinoInstitucionalScreen() {
  const { gameState, spinCassinoInstitucional, nextCassinoTurn, endBetsSession } = useGame();
  const { odds } = useBetsOdds();
  const [spinning, setSpinning] = useState(false);
  const [slotReels, setSlotReels] = useState(['🎰', '🎰', '🎰']);

  // Gate: a equipe precisa acertar a pergunta institucional antes de poder girar
  const [question] = useState(randomQuestion);
  const [unlocked, setUnlocked] = useState(false);
  const [wrongFeedback, setWrongFeedback] = useState(false);

  // Popup temporário (6s) de bombom ganho/devolvido — o componente remonta a cada
  // troca de turno, então o resultado do giro anterior já está disponível no mount.
  const [candyPopup, setCandyPopup] = useState(() => {
    if (gameState.phase !== 'spin_result' || !gameState.lastSpinResult) return null;
    if (gameState.lastSpinResult.candyAwarded) return 'awarded';
    if (gameState.lastSpinResult.candyReturned) return 'returned';
    return null;
  }); // 'awarded' | 'returned' | null

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const canSpin = currentTeam.score >= gameState.spinCost;

  const handleAnswer = (idx) => {
    if (idx === question.correct) {
      setUnlocked(true);
      setWrongFeedback(false);
    } else {
      setWrongFeedback(true);
    }
  };

  const handleSpinClick = () => {
    if (!canSpin || spinning) return;
    setSpinning(true);
    let spins = 0;
    const interval = setInterval(() => {
      setSlotReels([
        EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      ]);
      spins++;
      if (spins > 15) {
        clearInterval(interval);
        spinCassinoInstitucional(odds);
        setSpinning(false);
      }
    }, 100);
  };

  // slotReels so vale durante a animacao; fora dela os rolos sao derivados do
  // estado do jogo. Antes isso era sincronizado por um useEffect que chamava
  // setState no corpo, causando renders em cascata.
  // No 'spin_result' o turno ja passou para a proxima equipe, mas o painel
  // mostra o resultado da anterior: exibimos quem realmente girou.
  const spinnerIndex = gameState.lastSpinResult
    ? gameState.teams.findIndex((t) => t.id === gameState.lastSpinResult.teamId)
    : -1;
  const displayTeamIndex = gameState.phase === 'spin_result' && spinnerIndex >= 0
    ? spinnerIndex
    : gameState.currentTeamIndex;

  const displayReels = spinning
    ? slotReels
    : (gameState.phase === 'spin_result' && gameState.lastSpinResult
        ? gameState.lastSpinResult.emojis
        : ['🎰', '🎰', '🎰']);

  useEffect(() => {
    if (!candyPopup) return;
    const timer = setTimeout(() => setCandyPopup(null), 6000);
    return () => clearTimeout(timer);
  }, [candyPopup]);

  const showQuizGate = !unlocked && gameState.phase !== 'spin_result';

  return (
    <GameLayout currentTeamIndex={displayTeamIndex} teams={gameState.teams} rightPanel={<CassinoInstStats />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '40px' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>CASSINO INSTITUCIONAL</h1>

        {/* Odds badge */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ background: 'rgba(57,255,20,0.12)', border: '1px solid rgba(57,255,20,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t3)' }}>
            ✅ Jogador: {odds.cassino_inst}%
          </span>
          <span style={{ background: 'rgba(255,0,122,0.12)', border: '1px solid rgba(255,0,122,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t2)' }}>
            🏦 Banca: {100 - odds.cassino_inst}%
          </span>
        </div>

        {showQuizGate ? (
          <div className="glass animate-fade" style={{ padding: '30px 40px', borderRadius: '20px', maxWidth: '640px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--t1)' }}>🏢 Responda para poder girar</h2>
            <p style={{ fontSize: '1.2rem', margin: 0 }}>{question.q}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  className="btn btn-secondary"
                  style={{ fontSize: '1.05rem', padding: '14px 20px', textAlign: 'left' }}
                  onClick={() => handleAnswer(idx)}
                >
                  {String.fromCharCode(97 + idx)}) {opt}
                </button>
              ))}
            </div>
            {wrongFeedback && (
              <p style={{ color: 'var(--t2)', fontWeight: '700', margin: 0 }}>❌ Resposta incorreta, tente novamente!</p>
            )}
          </div>
        ) : (
          <>
            <div className="glass" style={{
              display: 'flex', gap: '20px', padding: '40px', borderRadius: '30px',
              background: 'rgba(0,0,0,0.6)', border: '4px solid var(--t4)',
              boxShadow: '0 0 40px var(--t4)40'
            }}>
              {displayReels.map((emoji, i) => (
                <div key={i} style={{
                  width: '120px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '5rem', background: '#fff', borderRadius: '15px', color: '#000',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                }}>
                  {emoji}
                </div>
              ))}
            </div>

            {gameState.phase !== 'spin_result' ? (
              <button
                className="btn btn-primary"
                style={{ fontSize: '2rem', padding: '20px 60px', borderRadius: '50px', background: 'var(--t4)', color: '#000', opacity: canSpin ? 1 : 0.5, border: 'none', cursor: canSpin && !spinning ? 'pointer' : 'not-allowed' }}
                onClick={handleSpinClick}
                disabled={!canSpin || spinning}
              >
                {spinning ? 'GIRANDO...' : `APOSTAR R$ ${gameState.spinCost}`}
              </button>
            ) : (
              <div className="animate-fade" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', color: gameState.lastSpinResult.isWin ? 'var(--t3)' : 'var(--t2)', textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                  {gameState.lastSpinResult.isWin ? `💰 VOCÊ GANHOU R$ ${gameState.lastSpinResult.prize}! 💰` : '❌ PERDEU! ❌'}
                </h2>
                <p style={{ fontSize: '1.5rem', color: 'var(--muted)' }}>
                  A Casa agradece sua contribuição.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '1.2rem', padding: '15px 40px' }} onClick={nextCassinoTurn}>
                    Próxima Equipe →
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ opacity: 0.7 }}>🏁 Encerrar</button>
                </div>
              </div>
            )}

            {/* Sem saldo a sessao ficava sem saida: os botoes de avancar e
                encerrar so existiam no ramo 'spin_result'. */}
            {!canSpin && gameState.phase !== 'spin_result' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--t2)', fontSize: '1.2rem', fontWeight: 'bold' }}>Saldo insuficiente para apostar!</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '1.2rem', padding: '15px 40px' }} onClick={nextCassinoTurn}>
                    Próxima Equipe →
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ opacity: 0.7 }}>🏁 Encerrar</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {candyPopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)',
        }}>
          <div className="glass animate-fade" style={{
            padding: '36px 48px', borderRadius: '24px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
            background: candyPopup === 'awarded' ? 'rgba(57,255,20,0.12)' : 'rgba(255,0,122,0.12)',
            border: `2px solid ${candyPopup === 'awarded' ? 'var(--t3)' : 'var(--t2)'}`,
            boxShadow: `0 0 50px ${candyPopup === 'awarded' ? 'var(--t3)' : 'var(--t2)'}60`,
          }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={bombomImg} alt="Bombom" style={{ width: '160px', height: '160px', objectFit: 'contain', filter: candyPopup === 'returned' ? 'grayscale(40%)' : 'none' }} />
              {candyPopup === 'returned' && (
                <span style={{ position: 'absolute', fontSize: '5rem', color: '#ff1a1a', textShadow: '0 0 12px rgba(0,0,0,0.6)' }}>❌</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: candyPopup === 'awarded' ? 'var(--t3)' : 'var(--t2)' }}>
              {candyPopup === 'awarded' ? '🍬 Bombom conquistado! Pegue um na cesta!' : '😢 Devolva um bombom para a cesta!'}
            </p>
          </div>
        </div>
      )}
    </GameLayout>
  );
}

function CassinoInstStats() {
  const { gameState } = useGame();
  const activeTeam = gameState.phase === 'spin_result' && gameState.lastSpinResult
    ? gameState.teams.find(t => t.id === gameState.lastSpinResult.teamId)
    : gameState.teams[gameState.currentTeamIndex];

  return (
    <div className="glass animate-slide" style={{ padding: '20px', textAlign: 'center', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', background: 'rgba(255, 0, 122, 0.1)', border: '2px solid var(--t2)' }}>
      <h3>🏦 COFRE DA CASA</h3>
      <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--t2)', textShadow: '0 0 10px var(--t2)' }}>
        R$ {Math.floor(gameState.houseBalance || 0)}
      </p>
      <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>A banca sempre vence.</p>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>🍬 Bombons de:</p>
        <p style={{ margin: '2px 0 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{activeTeam?.name}</p>
        <p style={{ margin: '4px 0 0', fontSize: '2rem', fontWeight: '800', color: 'var(--t3)' }}>{activeTeam?.candies || 0}</p>
      </div>
    </div>
  );
}
