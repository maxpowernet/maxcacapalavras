import React, { useState, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { GameLayout } from './GameLayout';
import { useBetsOdds } from '../../hooks/useBetsOdds';

const EMOJIS = ['🍎', '🍌', '🍉'];

export default function CassinoScreen() {
  const { gameState, spinCassino, nextCassinoTurn, endBetsSession } = useGame();
  const { odds } = useBetsOdds();
  const [spinning, setSpinning] = useState(false);
  const [slotReels, setSlotReels] = useState(['🎰', '🎰', '🎰']);

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const canSpin = currentTeam.score >= gameState.spinCost;

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
        spinCassino(odds);
        setSpinning(false);
      }
    }, 100);
  };

  useEffect(() => {
    if (gameState.phase === 'spin_result' && gameState.lastSpinResult) {
      setSlotReels(gameState.lastSpinResult.emojis);
    } else if (!spinning) {
      setSlotReels(['🎰', '🎰', '🎰']);
    }
  }, [gameState.phase, gameState.lastSpinResult, spinning]);

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={<CassinoStats />} showFullscreen>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '40px' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>CASSINO EDUCACIONAL</h1>

        {/* Odds badge */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ background: 'rgba(57,255,20,0.12)', border: '1px solid rgba(57,255,20,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t3)' }}>
            ✅ Jogador: {odds.cassino}%
          </span>
          <span style={{ background: 'rgba(255,0,122,0.12)', border: '1px solid rgba(255,0,122,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t2)' }}>
            🏦 Banca: {100 - odds.cassino}%
          </span>
        </div>
        
        <div className="glass" style={{
          display: 'flex', gap: '20px', padding: '40px', borderRadius: '30px',
          background: 'rgba(0,0,0,0.6)', border: '4px solid var(--t4)',
          boxShadow: '0 0 40px var(--t4)40'
        }}>
          {slotReels.map((emoji, i) => (
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

        {!canSpin && gameState.phase !== 'spin_result' && (
           <p style={{ color: 'var(--t2)', fontSize: '1.2rem', fontWeight: 'bold' }}>Saldo insuficiente para apostar!</p>
        )}
      </div>
    </GameLayout>
  );
}

function CassinoStats() {
  const { gameState } = useGame();
  return (
    <div className="glass animate-slide" style={{ padding: '20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', background: 'rgba(255, 0, 122, 0.1)', border: '2px solid var(--t2)' }}>
      <h3>🏦 COFRE DA CASA</h3>
      <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--t2)', textShadow: '0 0 10px var(--t2)' }}>
        R$ {Math.floor(gameState.houseBalance || 0)}
      </p>
      <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>A banca sempre vence.</p>
    </div>
  );
}
