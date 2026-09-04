import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { GameLayout } from './GameLayout';
import { useBetsOdds } from '../../hooks/useBetsOdds';

const MIN_BET = 10;

export default function CrashScreen() {
  const { gameState, updateTeamScore, addHouseBalance, nextTurn, endBetsSession } = useGame();
  const { odds } = useBetsOdds();

  // Estado como string para permitir digitação livre sem forçar limites durante edição
  const [betAmountStr, setBetAmountStr] = useState('100');
  const [multiplier, setMultiplier] = useState(1.0);
  const [status, setStatus] = useState('idle'); // idle, playing, crashed, cashed_out

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const timerRef = useRef(null);
  // Fix: usar ref para que o closure do setInterval sempre leia o valor atualizado
  const crashPointRef = useRef(0);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Valor numérico derivado do input (undefined quando inválido)
  const betValue = parseInt(betAmountStr, 10);
  const betError = (() => {
    if (!betAmountStr.trim() || isNaN(betValue) || betValue <= 0) return 'Digite um valor válido.';
    if (betValue < MIN_BET) return `Aposta mínima: ${MIN_BET} pts.`;
    if (betValue > currentTeam.score) return 'Saldo insuficiente!';
    return null;
  })();
  const canBet = betError === null;

  const handleStart = () => {
    if (!canBet) return;

    updateTeamScore(gameState.currentTeamIndex, -betValue);
    addHouseBalance(betValue);

    // Usar odds configurado: se rand >= playerWinChance → crash instantâneo
    const playerWinChance = odds.crash / 100;
    if (Math.random() >= playerWinChance) {
      crashPointRef.current = 1.00;
    } else {
      const e = 100 / (100 - Math.random() * 99);
      crashPointRef.current = Math.max(1.5, e);
    }

    setMultiplier(1.0);
    setStatus('playing');

    timerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = prev + 0.01 * prev;
        if (next >= crashPointRef.current) {
          clearInterval(timerRef.current);
          setStatus('crashed');
          return crashPointRef.current;
        }
        return next;
      });
    }, 50);
  };

  const handleCashOut = () => {
    if (status !== 'playing') return;
    clearInterval(timerRef.current);

    const prize = betValue * multiplier;
    updateTeamScore(gameState.currentTeamIndex, prize);
    addHouseBalance(-prize);

    setStatus('cashed_out');
  };

  const handleNext = () => {
    setStatus('idle');
    setMultiplier(1.0);
    setBetAmountStr('100');
    nextTurn();
  };

  // Atalhos de aposta rápida
  const quickAdd = (amount) => {
    const current = parseInt(betAmountStr, 10) || 0;
    const next = Math.min(current + amount, currentTeam.score);
    setBetAmountStr(String(next));
  };

  return (
    <GameLayout currentTeamIndex={gameState.currentTeamIndex} teams={gameState.teams} rightPanel={<HouseStats />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--t2)', margin: 0 }}>AVIÃOZINHO (CRASH)</h1>

        {/* Odds badge */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ background: 'rgba(57,255,20,0.12)', border: '1px solid rgba(57,255,20,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t3)' }}>
            ✅ Jogador: {odds.crash}%
          </span>
          <span style={{ background: 'rgba(255,0,122,0.12)', border: '1px solid rgba(255,0,122,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--t2)' }}>
            🏦 Banca: {100 - odds.crash}%
          </span>
        </div>

        <div className="glass" style={{
          width: '80%', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRadius: '20px', border: `4px solid ${status === 'crashed' ? 'var(--t2)' : status === 'cashed_out' ? 'var(--t3)' : 'var(--panel-b)'}`,
          background: status === 'crashed' ? 'rgba(255,0,122,0.1)' : status === 'cashed_out' ? 'rgba(57,255,20,0.1)' : 'rgba(0,0,0,0.5)',
          transition: 'all 0.3s'
        }}>
          <div style={{ fontSize: '6rem', fontWeight: '900', color: status === 'crashed' ? 'var(--t2)' : status === 'cashed_out' ? 'var(--t3)' : '#fff', fontFamily: 'monospace' }}>
            {multiplier.toFixed(2)}x
          </div>
          {status === 'crashed' && <h2 style={{ color: 'var(--t2)', fontSize: '2rem', margin: 0 }}>ESTOUROU!</h2>}
          {status === 'cashed_out' && <h2 style={{ color: 'var(--t3)', fontSize: '2rem', margin: 0 }}>LUCRO GARANTIDO!</h2>}
        </div>

        {status === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>

            {/* Info de saldo */}
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', gap: '16px' }}>
              <span>💰 Saldo: <strong style={{ color: 'var(--text)' }}>{Math.floor(currentTeam.score)} pts</strong></span>
              <span>📉 Mín: <strong style={{ color: 'var(--t3)' }}>{MIN_BET} pts</strong></span>
              <span>📈 Máx: <strong style={{ color: 'var(--t1)' }}>{Math.floor(currentTeam.score)} pts</strong></span>
            </div>

            {/* Input de aposta + botão principal */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <label style={{ fontSize: '1.2rem' }}>Aposta:</label>
              <input
                type="number"
                value={betAmountStr}
                min={MIN_BET}
                max={currentTeam.score}
                onChange={e => setBetAmountStr(e.target.value)}
                style={{
                  padding: '10px',
                  fontSize: '1.5rem',
                  width: '160px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: betError ? '2px solid var(--danger)' : '2px solid var(--panel-b)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <button
                className="btn btn-primary"
                style={{ padding: '15px 36px', fontSize: '1.4rem', background: 'var(--t2)', opacity: canBet ? 1 : 0.45 }}
                onClick={handleStart}
                disabled={!canBet}
              >
                ✈️ APOSTAR E DECOLAR
              </button>
            </div>

            {/* Mensagem de erro */}
            {betError && (
              <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                ⚠️ {betError}
              </p>
            )}

            {/* Botões de atalho rápido */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: 'Mín (10)', action: () => setBetAmountStr(String(MIN_BET)) },
                { label: '+10',      action: () => quickAdd(10) },
                { label: '+50',      action: () => quickAdd(50) },
                { label: 'Tudo',     action: () => setBetAmountStr(String(Math.floor(currentTeam.score))) },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--panel-b)',
                    background: 'rgba(255,255,255,0.07)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                >
                  {label}
                </button>
              ))}
            </div>

            <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ opacity: 0.65, marginTop: '4px' }}>
              🏁 Encerrar Sessão
            </button>
          </div>
        )}

        {status === 'playing' && (
          <button className="btn btn-primary" style={{ padding: '20px 60px', fontSize: '2rem', background: 'var(--t3)', color: '#000' }} onClick={handleCashOut}>
            SACAR AGORA!
          </button>
        )}

        {(status === 'crashed' || status === 'cashed_out') && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ padding: '15px 40px', fontSize: '1.2rem' }} onClick={handleNext}>
              Próxima Equipe →
            </button>
            <button className="btn btn-secondary btn-sm" onClick={endBetsSession} style={{ opacity: 0.7 }}>
              🏁 Encerrar
            </button>
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
