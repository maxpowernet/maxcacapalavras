import React from 'react';

const PARTS = [
  // Cabeça
  (ctx, cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy - r * 2.5, r, 0, Math.PI * 2); ctx.stroke(); },
  // Corpo
  (ctx, cx, cy, r) => { ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.5); ctx.lineTo(cx, cy + r * 1.5); ctx.stroke(); },
  // Braço esquerdo
  (ctx, cx, cy, r) => { ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.5); ctx.lineTo(cx - r * 1.2, cy + r * 0.5); ctx.stroke(); },
  // Braço direito
  (ctx, cx, cy, r) => { ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.5); ctx.lineTo(cx + r * 1.2, cy + r * 0.5); ctx.stroke(); },
  // Perna esquerda
  (ctx, cx, cy, r) => { ctx.beginPath(); ctx.moveTo(cx, cy + r * 1.5); ctx.lineTo(cx - r * 1.2, cy + r * 3); ctx.stroke(); },
  // Perna direita
  (ctx, cx, cy, r) => { ctx.beginPath(); ctx.moveTo(cx, cy + r * 1.5); ctx.lineTo(cx + r * 1.2, cy + r * 3); ctx.stroke(); },
];

export default function HangmanDisplay({ wrongCount, color = '#FF007A' }) {
  const canvasRef = React.useRef(null);
  const size = 200;
  const r = 18;
  const cx = size / 2;
  const cy = size / 2 - 10;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    // Forca — use a neutral colour visible on both light and dark themes
    const isDark = !document.body.classList.contains('light-theme');
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // base
    ctx.beginPath(); ctx.moveTo(20, size - 10); ctx.lineTo(size - 20, size - 10); ctx.stroke();
    // poste
    ctx.beginPath(); ctx.moveTo(60, size - 10); ctx.lineTo(60, 20); ctx.stroke();
    // topo
    ctx.beginPath(); ctx.moveTo(60, 20); ctx.lineTo(cx, 20); ctx.stroke();
    // corda
    ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, cy - r * 3.5); ctx.stroke();

    // Boneco
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    for (let i = 0; i < Math.min(wrongCount, 6); i++) {
      PARTS[i](ctx, cx, cy, r);
    }
  }, [wrongCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
}
