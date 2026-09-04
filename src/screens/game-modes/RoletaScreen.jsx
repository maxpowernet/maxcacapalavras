import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { GameLayout } from './GameLayout';
import { useBetsOdds } from '../../hooks/useBetsOdds';

// 17 segments: index 0 = green, odd indices = red, even non-zero = black
const SEGS = 17;
const SEG_DEG = 360 / SEGS;
const SEG_COLORS = [
  '#00FF41','#FF003C','#111111','#FF003C','#111111',
  '#FF003C','#111111','#FF003C','#111111','#FF003C',
  '#111111','#FF003C','#111111','#FF003C','#111111',
  '#FF003C','#111111',
];
const WHEEL_GRADIENT = SEG_COLORS.map((c, i) =>
  `${c} ${(i * SEG_DEG).toFixed(2)}deg ${((i + 1) * SEG_DEG).toFixed(2)}deg`
).join(',');

const COLOR_SEG_MAP = {
  green: [0],
  red: [1,3,5,7,9,11,13,15],
  black: [2,4,6,8,10,12,14,16],
};

export default function RoletaScreen() {
  const { gameState, updateTeamScore, addHouseBalance, nextTurn, endBetsSession } = useGame();
  const { odds } = useBetsOdds();

  const [betAmount, setBetAmount] = useState(100);
  const [selectedColor, setSelectedColor] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [resultColor, setResultColor] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const currentTeam = gameState.teams[gameState.currentTeamIndex];

  const handleSpin = () => {
    if (!selectedColor || currentTeam.score < betAmount || spinning) return;

    updateTeamScore(gameState.currentTeamIndex, -betAmount);
    addHouseBalance(betAmount);

    // Determinar resultado com base nas odds configuradas
    const playerChance = odds.roleta / 100;
    const rand = Math.random();
    let color;
    if (rand < playerChance / 2) color = 'red';
    else if (rand < playerChance) color = 'black';
    else color = 'green';

    // Escolher segmento aleatório do resultado
    const segIndices = COLOR_SEG_MAP[color];
    const seg = segIndices[Math.floor(Math.random() * segIndices.length)];

    // Calcular rotação para parar no segmento correto
    // O ponteiro aponta para o ângulo (360 - rotation % 360) % 360 da roda
    const currentPointed = ((360 - wheelRotation % 360) + 360) % 360;
    const targetAngle = (seg + 0.5) * SEG_DEG; // centro do segmento
    let additional = (360 + currentPointed - targetAngle) % 360;
    if (additional < 30) additional += 360; // garantir giro mínimo
    const newRotation = wheelRotation + 5 * 360 + additional;

    setSpinning(true);
    setResultColor(null);
    setTransitioning(true);
    setWheelRotation(newRotation);

    setTimeout(() => {
      setResultColor(color);
      setSpinning(false);
      setTransitioning(false);
      if (color === selectedColor) {
        updateTeamScore(gameState.currentTeamIndex, betAmount * 2);
        addHouseBalance(-(betAmount * 2));
      }
    }, 3300);
  };

  const handleNext = () => {
    setResultColor(null);
    setSelectedColor(null);
    nextTurn();
  };

  const colorsMap = {
    red:   { hex: '#FF003C', label: 'VERMELHO' },
    black: { hex: '#222222', label: 'PRETO' },
    green: { hex: '#00FF41', label: 'VERDE (CASA)' },
  };

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={<HouseStats />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--t3)', margin: 0 }}>ROLETA DA CASA</h1>

        {/* Odds badge */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ background: 'rgba(57,255,20,0.12)', border: '1px solid rgba(57,255,20,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t3)' }}>
            ✅ Jogador: {odds.roleta}%
          </span>
          <span style={{ background: 'rgba(255,0,122,0.12)', border: '1px solid rgba(255,0,122,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t2)' }}>
            🏦 Banca: {100 - odds.roleta}%
          </span>
        </div>

        {/* Roulette Wheel */}
        <div style={{ position: 'relative', width: '240px', height: '240px' }}>
          {/* Ponteiro fixo */}
          <div style={{
            position: 'absolute', top: '-26px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, zIndex: 10,
            borderLeft: '13px solid transparent',
            borderRight: '13px solid transparent',
            borderTop: '28px solid #FFD700',
            filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.9))',
          }} />
          {/* Anel externo decorativo */}
          <div style={{
            position: 'absolute', inset: '-6px', borderRadius: '50%',
            border: '6px solid #8B6914',
            boxShadow: '0 0 20px rgba(255,215,0,0.2), inset 0 0 10px rgba(0,0,0,0.5)',
            zIndex: 2, pointerEvents: 'none',
          }} />
          {/* Roda giratória */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `conic-gradient(${WHEEL_GRADIENT})`,
            transform: `rotate(${wheelRotation}deg)`,
            transition: transitioning ? 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
            boxShadow: '0 0 30px rgba(0,0,0,0.6)',
          }} />
          {/* Hub central */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD700 20%, #8B6914 100%)',
            border: '3px solid #FFD700',
            boxShadow: '0 0 12px rgba(255,215,0,0.6)',
            zIndex: 5,
          }} />
        </div>

        {/* Controles de aposta */}
        {!spinning && !resultColor && (
          <div className="glass" style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center', borderRadius: '20px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button
                style={{ width: '120px', height: '72px', borderRadius: '10px', background: '#FF003C', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', border: selectedColor === 'red' ? '4px solid #fff' : '4px solid transparent', cursor: 'pointer' }}
                onClick={() => setSelectedColor('red')}
              >VERMELHO</button>
              <button
                style={{ width: '120px', height: '72px', borderRadius: '10px', background: '#222222', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', border: selectedColor === 'black' ? '4px solid #fff' : '4px solid transparent', cursor: 'pointer' }}
                onClick={() => setSelectedColor('black')}
              >PRETO</button>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <label>Aposta:</label>
              <input type="number" value={betAmount} onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
                style={{ padding: '10px', fontSize: '1.2rem', width: '120px', borderRadius: '10px', textAlign: 'center' }} />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1.4rem', background: 'var(--t3)', color: '#000', opacity: selectedColor && currentTeam.score >= betAmount ? 1 : 0.5 }}
              onClick={handleSpin} disabled={!selectedColor || currentTeam.score < betAmount}
            >GIRAR ROLETA</button>
            <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ width: '100%', opacity: 0.65 }}>
              🏁 Encerrar Sessão
            </button>
          </div>
        )}

        {/* Resultado */}
        {resultColor && !spinning && (
          <div className="animate-fade" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: colorsMap[resultColor].hex,
                border: '4px solid rgba(255,255,255,0.25)',
                boxShadow: `0 0 28px ${colorsMap[resultColor].hex}88`,
              }} />
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '8px', fontSize: '1rem' }}>
              Resultado: <strong style={{ color: colorsMap[resultColor].hex }}>{colorsMap[resultColor].label}</strong>
            </p>
            {resultColor === selectedColor ? (
              <h2 style={{ color: 'var(--t3)', fontSize: '2rem', margin: '0 0 16px' }}>💰 VOCÊ GANHOU R$ {betAmount * 2}!</h2>
            ) : resultColor === 'green' ? (
              <h2 style={{ color: 'var(--t2)', fontSize: '1.8rem', margin: '0 0 16px' }}>👽 A CASA VENCEU (VERDE)!</h2>
            ) : (
              <h2 style={{ color: 'var(--t2)', fontSize: '2rem', margin: '0 0 16px' }}>❌ PERDEU!</h2>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={handleNext}>Próxima Equipe →</button>
              <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ opacity: 0.7 }}>🏁 Encerrar</button>
            </div>
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


