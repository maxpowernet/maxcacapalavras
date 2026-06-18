import { useGame } from '../hooks/useGame';
import BrandLogo from './BrandLogo';

export default function PauseOverlay() {
  const { togglePause, quitGame } = useGame();

  const handleQuit = () => {
    if (window.confirm("Deseja encerrar este jogo? O progresso será perdido.")) {
      quitGame();
    }
  };

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
        <button className="btn btn-danger" onClick={handleQuit}>
          ✕ Encerrar Jogo
        </button>
      </div>
    </div>
  );
}
