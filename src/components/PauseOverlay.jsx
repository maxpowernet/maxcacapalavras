import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import BrandLogo from './BrandLogo';

export default function PauseOverlay() {
  const { togglePause, quitGame } = useGame();
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(6, 6, 15, 0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '30px',
    }}>
      <BrandLogo />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>⏸️</div>
        <h2 style={{ fontSize: '2.5rem', letterSpacing: '4px', color: 'var(--t1)', textShadow: '0 0 20px var(--t1)' }}>
          JOGO PAUSADO
        </h2>
        <p style={{ marginTop: '8px' }}>Pressione Retomar para continuar</p>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn btn-primary btn-lg" onClick={togglePause}>
          ▶ Retomar
        </button>
        <button className="btn btn-danger" onClick={() => setConfirming(true)}>
          ✕ Encerrar Jogo
        </button>
      </div>

      {/* ── Modal de confirmação de encerramento ─────────────────────────── */}
      {confirming && (
        <div
          onClick={() => setConfirming(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9100,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(18,18,30,0.98) 0%, rgba(30,10,20,0.98) 100%)',
              border: '1px solid rgba(255,51,85,0.35)',
              borderRadius: '20px',
              padding: '40px 48px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 0 60px rgba(255,51,85,0.2), 0 24px 48px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              animation: 'fadeInScale 0.18s ease-out',
            }}
          >
            {/* Ícone de alerta */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(255,51,85,0.15)',
              border: '2px solid rgba(255,51,85,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem',
            }}>
              ⚠️
            </div>

            {/* Título */}
            <h2 style={{
              margin: 0, fontSize: '1.55rem', fontWeight: 800,
              color: '#fff', textAlign: 'center', letterSpacing: '1px',
            }}>
              Encerrar o jogo?
            </h2>

            {/* Subtítulo */}
            <p style={{
              margin: 0, fontSize: '0.95rem', textAlign: 'center',
              color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
            }}>
              Todo o progresso desta sessão será perdido e não poderá ser recuperado.
            </p>

            {/* Separador */}
            <div style={{
              width: '100%', height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(255,51,85,0.3), transparent)',
            }} />

            {/* Botões */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '1rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                Cancelar
              </button>
              <button
                onClick={quitGame}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff3355 0%, #c0002a 100%)',
                  border: '1px solid rgba(255,51,85,0.5)',
                  color: '#fff', fontSize: '1rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(255,51,85,0.4)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,51,85,0.65)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,51,85,0.4)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                ✕ Sim, encerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
