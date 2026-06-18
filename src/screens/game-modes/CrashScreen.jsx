import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { GameLayout } from './GameLayout';

export default function CrashScreen() {
  const { gameState, updateTeamScore, addHouseBalance, nextTurn } = useGame();
  
  const [betAmount, setBetAmount] = useState(100);
  const [multiplier, setMultiplier] = useState(1.0);
  const [status, setStatus] = useState('idle'); // idle, playing, crashed, cashed_out
  const [crashPoint, setCrashPoint] = useState(0);
  
  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleStart = () => {
    if (currentTeam.score < betAmount) return;
    
    // Deduzir aposta
    updateTeamScore(gameState.currentTeamIndex, -betAmount);
    // Adicionar à casa temporariamente (se sacar, a casa paga de volta + lucro)
    addHouseBalance(betAmount);

    // Gerar ponto de crash (house edge embutida)
    // 10% de chance de crash instantâneo (1.00x)
    if (Math.random() < 0.10) {
      setCrashPoint(1.00);
    } else {
      // Fórmula clássica de crash game
      const e = 100 / (100 - (Math.random() * 100));
      setCrashPoint(Math.max(1.01, e));
    }

    setMultiplier(1.0);
    setStatus('playing');

    timerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = prev + 0.01 * prev; // Crescimento exponencial lento
        if (next >= crashPoint) {
          clearInterval(timerRef.current);
          setStatus('crashed');
          return crashPoint;
        }
        return next;
      });
    }, 50);
  };

  const handleCashOut = () => {
    if (status !== 'playing') return;
    clearInterval(timerRef.current);
    
    const prize = betAmount * multiplier;
    updateTeamScore(gameState.currentTeamIndex, prize);
    addHouseBalance(-prize); // A casa paga o prêmio
    
    setStatus('cashed_out');
  };

  const handleNext = () => {
    setStatus('idle');
    setMultiplier(1.0);
    nextTurn();
  };

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={<HouseStats />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--t2)' }}>AVIÃOZINHO (CRASH)</h1>
        
        <div className="glass" style={{
          width: '80%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRadius: '20px', border: `4px solid ${status === 'crashed' ? 'var(--t2)' : status === 'cashed_out' ? 'var(--t3)' : 'var(--panel-b)'}`,
          background: status === 'crashed' ? 'rgba(255,0,122,0.1)' : status === 'cashed_out' ? 'rgba(57,255,20,0.1)' : 'rgba(0,0,0,0.5)',
          transition: 'all 0.3s'
        }}>
          <div style={{ fontSize: '6rem', fontWeight: '900', color: status === 'crashed' ? 'var(--t2)' : status === 'cashed_out' ? 'var(--t3)' : '#fff', fontFamily: 'monospace' }}>
            {multiplier.toFixed(2)}x
          </div>
          {status === 'crashed' && <h2 style={{ color: 'var(--t2)', fontSize: '2rem', margin: 0, textTransform: 'uppercase' }}>ESTOUROU!</h2>}
          {status === 'cashed_out' && <h2 style={{ color: 'var(--t3)', fontSize: '2rem', margin: 0 }}>LUCRO GARANTIDO!</h2>}
        </div>

        {status === 'idle' && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <label style={{ fontSize: '1.2rem' }}>Aposta:</label>
            <input 
              type="number" 
              value={betAmount} 
              onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
              style={{ padding: '10px', fontSize: '1.5rem', width: '150px', borderRadius: '10px', textAlign: 'center' }}
            />
            <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '1.5rem', background: 'var(--t2)' }} onClick={handleStart}>
              APOSTAR E DECOLAR
            </button>
          </div>
        )}

        {status === 'playing' && (
          <button className="btn btn-primary" style={{ padding: '20px 60px', fontSize: '2rem', background: 'var(--t3)', color: '#000' }} onClick={handleCashOut}>
            SACAR AGORA!
          </button>
        )}

        {(status === 'crashed' || status === 'cashed_out') && (
          <button className="btn btn-secondary" style={{ padding: '15px 40px', fontSize: '1.2rem' }} onClick={handleNext}>
            Próxima Equipe →
          </button>
        )}
        
        {status === 'idle' && currentTeam.score < betAmount && (
          <p style={{ color: 'var(--t2)' }}>Saldo insuficiente!</p>
        )}
      </div>
    </GameLayout>
  );
}

function HouseStats() {
  const { gameState } = useGame();
  return (
    <div className="glass" style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.5)', marginTop: '20px' }}>
      <h3>🏦 COFRE DA CASA</h3>
      <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--t2)' }}>
        R$ {Math.floor(gameState.houseBalance || 0)}
      </p>
    </div>
  );
}
