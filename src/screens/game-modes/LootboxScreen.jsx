import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { GameLayout } from './GameLayout';
import { useBetsOdds } from '../../hooks/useBetsOdds';

// Computa raridades com base no % de vitória configurado
// rare + legendary somam playerWinPct; proporção 4:1 mantida
function computeRarities(playerWinPct) {
  const p = Math.max(0, Math.min(90, playerWinPct));
  const legendary = p / 5;
  const rare = (p * 4) / 5;
  const uncommon = Math.min(10, 100 - p - 1);
  const common = Math.max(0, 100 - p - uncommon);
  return [
    { name: 'Lixo (Comum)', chance: common / 100, multiplier: 0.1, color: '#888' },
    { name: 'Incomum', chance: uncommon / 100, multiplier: 0.5, color: '#00F2FF' },
    { name: 'Raro', chance: rare / 100, multiplier: 2.0, color: '#9D00FF' },
    { name: 'Lendário', chance: legendary / 100, multiplier: 10.0, color: '#FFBD33' },
  ];
}

export default function LootboxScreen() {
  const { gameState, updateTeamScore, addHouseBalance, nextTurn, endBetsSession } = useGame();
  const { odds } = useBetsOdds();

  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState(null);

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const boxPrice = 100;
  const RARITIES = computeRarities(odds.lootbox);

  const handleOpenBox = () => {
    if (currentTeam.score < boxPrice || opening) return;
    
    updateTeamScore(gameState.currentTeamIndex, -boxPrice);
    addHouseBalance(boxPrice);
    setOpening(true);
    setResult(null);

    // Determinar resultado
    const rand = Math.random();
    let accumulated = 0;
    let selectedRarity = RARITIES[0];
    
    for (const rarity of RARITIES) {
      accumulated += rarity.chance;
      if (rand <= accumulated) {
        selectedRarity = rarity;
        break;
      }
    }

    setTimeout(() => {
      const prize = boxPrice * selectedRarity.multiplier;
      updateTeamScore(gameState.currentTeamIndex, prize);
      addHouseBalance(-prize);
      
      setResult({ ...selectedRarity, prize });
      setOpening(false);
    }, 2000);
  };

  const handleNext = () => {
    setResult(null);
    nextTurn();
  };

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={<HouseStats />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--t1)' }}>CAIXAS MISTERIOSAS</h1>

        {/* Odds badge */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ background: 'rgba(57,255,20,0.12)', border: '1px solid rgba(57,255,20,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t3)' }}>
            ✅ Jogador: {odds.lootbox}%
          </span>
          <span style={{ background: 'rgba(255,0,122,0.12)', border: '1px solid rgba(255,0,122,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t2)' }}>
            🏦 Banca: {100 - odds.lootbox}%
          </span>
        </div>
        
        <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {opening ? (
            <div style={{ fontSize: '8rem', animation: 'spin 0.5s infinite linear' }}>📦</div>
          ) : result ? (
            <div className="animate-slide" style={{ textAlign: 'center', background: result.color + '22', border: `4px solid ${result.color}`, padding: '30px', borderRadius: '20px', width: '100%' }}>
              <h2 style={{ color: result.color, fontSize: '2rem', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{result.name}</h2>
              <p style={{ fontSize: '1.5rem', margin: 0 }}>Você recebeu:</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '900', color: result.color, margin: 0 }}>R$ {result.prize}</p>
            </div>
          ) : (
            <div style={{ fontSize: '8rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={handleOpenBox}>📦</div>
          )}
        </div>

        {!opening && !result && (
          <>
            <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '1.5rem', background: 'var(--t1)', color: '#000' }} onClick={handleOpenBox} disabled={currentTeam.score < boxPrice}>
              COMPRAR BAÚ (R$ {boxPrice})
            </button>
            <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.9rem' }}>
              Lixo ({(RARITIES[0].chance*100).toFixed(0)}%) | Incomum ({(RARITIES[1].chance*100).toFixed(0)}%) | Raro ({(RARITIES[2].chance*100).toFixed(1)}%) | Lendário ({(RARITIES[3].chance*100).toFixed(1)}%)
            </p>
            <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ opacity: 0.65 }}>🏁 Encerrar Sessão</button>
          </>
        )}

        {result && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ padding: '15px 40px', fontSize: '1.2rem' }} onClick={handleNext}>
              Próxima Equipe →
            </button>
            <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ opacity: 0.7 }}>🏁 Encerrar</button>
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
