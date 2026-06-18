import { useEffect, useRef } from 'react';
import { useGame } from '../hooks/useGame';

const COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];
const HEX_COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33'];

const MODE_LABELS = {
  cacapalavras: '🔍 Caça-Palavras',
  quiz_tempo: '⚡ Quiz por Tempo',
  forca: '🔤 Forca em Equipe',
  eliminacao: '🧩 Quiz Eliminação',
  corrida: '🏃 Corrida do Saber',
  bomba: '💣 Bomba Relógio',
  duelo: '⚔️ Modo Duelo',
};

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣'];

export default function VictoryScreen() {
  const { gameState, quitGame } = useGame();
  const canvasRef = useRef(null);

  const sortedTeams = [...gameState.teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];
  const winnerHex = HEX_COLORS[winner.id % 4];
  const winnerVar = COLORS[winner.id % 4];

  // Confetti effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 250 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 5 + 2,
      size: Math.random() * 10 + 5,
      color: HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)],
      rot: Math.random() * 360,
      rotSpeed: Math.random() * 8 - 4,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    let animationId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Background glow for winner */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${winnerHex}12 0%, transparent 70%)` }} />

      <div className="glass animate-scale" style={{
        position: 'relative', zIndex: 10, padding: '50px 40px',
        width: '100%', maxWidth: '640px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: '28px',
        border: `2px solid ${winnerHex}40`,
        boxShadow: `0 0 60px ${winnerHex}30`,
      }}>
        {/* Trophy */}
        <div style={{ fontSize: '5rem', animation: 'float 2.5s ease-in-out infinite' }}>🏆</div>

        <div>
          <h1 style={{ fontSize: '3rem', margin: '0 0 8px', background: `linear-gradient(135deg, ${winnerHex}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            VITÓRIA!
          </h1>
          <h2 style={{ fontSize: '2rem', color: winnerVar, textShadow: `0 0 24px ${winnerHex}70`, margin: 0 }}>
            {winner.name}
          </h2>
          <p style={{ marginTop: '8px', color: 'var(--muted)' }}>
            {MODE_LABELS[gameState.gameMode] || '🔍 Caça-Palavras'}
          </p>
        </div>

        {/* Ranking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
          {sortedTeams.map((t, idx) => (
            <div
              key={t.id}
              className={idx === 0 ? 'animate-fade' : ''}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 20px', borderRadius: '12px',
                background: idx === 0 ? `${winnerHex}18` : 'rgba(255,255,255,0.04)',
                border: idx === 0 ? `1px solid ${winnerHex}50` : '1px solid rgba(255,255,255,0.06)',
                transform: idx === 0 ? 'scale(1.04)' : 'scale(1)',
                animationDelay: `${idx * 0.1}s`,
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>{MEDALS[idx] || `#${idx + 1}`}</span>
                <span style={{ fontWeight: idx === 0 ? '800' : '600', color: idx === 0 ? winnerVar : 'var(--text)' }}>{t.name}</span>
              </div>
              <span style={{ fontWeight: '900', fontSize: '1.1rem', color: idx === 0 ? winnerVar : 'var(--muted)' }}>
                {t.score} pts
              </span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-lg" onClick={quitGame}>
          Finalizar e Voltar ao Dashboard
        </button>
      </div>

      <style>{`@keyframes float { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-12px) rotate(3deg); } }`}</style>
    </div>
  );
}

