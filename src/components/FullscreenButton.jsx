import { useState, useEffect } from 'react';

// Botão fixo de tela cheia, reutilizado por todos os modos de jogo
export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
      style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.25)',
        color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)', transition: 'background 0.2s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
    >
      {isFullscreen ? '\u29C1' : '\u29C0'}
    </button>
  );
}
