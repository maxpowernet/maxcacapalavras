import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { GameLayout } from './GameLayout';

export default function RoletaScreen() {
  const { gameState, updateTeamScore, addHouseBalance, nextTurn } = useGame();
  
  const [betAmount, setBetAmount] = useState(100);
  const [selectedColor, setSelectedColor] = useState(null); // 'red' ou 'black'
  const [spinning, setSpinning] = useState(false);
  const [resultColor, setResultColor] = useState(null);
  
  const currentTeam = gameState.teams[gameState.currentTeamIndex];

  const handleSpin = () => {
    if (!selectedColor || currentTeam.score < betAmount || spinning) return;
    
    updateTeamScore(gameState.currentTeamIndex, -betAmount);
    addHouseBalance(betAmount);
    
    setSpinning(true);
    setResultColor(null);

    // Margem da casa (Verde) = 10%
    setTimeout(() => {
      const rand = Math.random();
      let color;
      if (rand < 0.10) color = 'green';
      else if (rand < 0.55) color = 'red';
      else color = 'black';
      
      setResultColor(color);
      setSpinning(false);
      
      if (color === selectedColor) {
        // Venceu (dobra a aposta)
        updateTeamScore(gameState.currentTeamIndex, betAmount * 2);
        addHouseBalance(-(betAmount * 2));
      }
    }, 2500);
  };

  const handleNext = () => {
    setResultColor(null);
    setSelectedColor(null);
    nextTurn();
  };

  const colorsMap = {
    red: { hex: '#FF003C', label: 'VERMELHO' },
    black: { hex: '#111111', label: 'PRETO' },
    green: { hex: '#00FF41', label: 'VERDE (CASA)' }
  };

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={<HouseStats />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--t3)' }}>ROLETA DA CASA</h1>
        
        {/* Roda da Roleta Visual Simplificada */}
        <div style={{
          width: '200px', height: '200px', borderRadius: '50%', border: '8px solid var(--panel-b)',
          background: resultColor ? colorsMap[resultColor].hex : 'conic-gradient(#FF003C 0deg 170deg, #111111 170deg 340deg, #00FF41 340deg 360deg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: spinning ? 'spin 0.2s linear infinite' : 'none',
          boxShadow: '0 0 30px rgba(0,0,0,0.5)'
        }}>
          {resultColor && !spinning && (
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', textShadow: '0 0 5px #000' }}>
              {colorsMap[resultColor].label}
            </span>
          )}
        </div>

        {/* Controles de Aposta */}
        {!spinning && !resultColor && (
          <div className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', borderRadius: '20px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button 
                style={{ width: '120px', height: '80px', borderRadius: '10px', background: '#FF003C', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', border: selectedColor === 'red' ? '4px solid #fff' : '4px solid transparent', cursor: 'pointer' }}
                onClick={() => setSelectedColor('red')}
              >
                VERMELHO
              </button>
              <button 
                style={{ width: '120px', height: '80px', borderRadius: '10px', background: '#111111', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', border: selectedColor === 'black' ? '4px solid #fff' : '4px solid transparent', cursor: 'pointer' }}
                onClick={() => setSelectedColor('black')}
              >
                PRETO
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <label>Aposta: </label>
              <input 
                type="number" value={betAmount} onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
                style={{ padding: '10px', fontSize: '1.2rem', width: '120px', borderRadius: '10px', textAlign: 'center' }}
              />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '15px', fontSize: '1.5rem', background: 'var(--t3)', color: '#000', opacity: selectedColor && currentTeam.score >= betAmount ? 1 : 0.5 }}
              onClick={handleSpin} disabled={!selectedColor || currentTeam.score < betAmount}
            >
              GIRAR ROLETA
            </button>
          </div>
        )}

        {/* Resultado */}
        {resultColor && !spinning && (
          <div className="animate-fade" style={{ textAlign: 'center', marginTop: '20px' }}>
            {resultColor === selectedColor ? (
              <h2 style={{ color: 'var(--t3)', fontSize: '2rem' }}>💰 VOCÊ GANHOU R$ {betAmount * 2}!</h2>
            ) : resultColor === 'green' ? (
              <h2 style={{ color: 'var(--t2)', fontSize: '2rem' }}>👽 A CASA VENCEU (VERDE)! TODOS PERDEM.</h2>
            ) : (
              <h2 style={{ color: 'var(--t2)', fontSize: '2rem' }}>❌ PERDEU!</h2>
            )}
            <button className="btn btn-secondary" style={{ marginTop: '20px' }} onClick={handleNext}>Próxima Equipe →</button>
          </div>
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
