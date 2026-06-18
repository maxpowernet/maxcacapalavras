import { useRef, useEffect, useState } from 'react';
import { GRID_SIZE, validateSelection } from '../utils/wordGrid';

const COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33'];

export default function WordGrid({ grid, answerCoords, activeTeamId, onComplete }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  
  const [drawnLines, setDrawnLines] = useState([]);
  const [foundCoords, setFoundCoords] = useState([]);
  const [showHint, setShowHint] = useState(false);

  const teamColor = COLORS[activeTeamId % 4];

  // Draw lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const getCenter = (r, c) => {
      const cellW = canvas.width / GRID_SIZE;
      const cellH = canvas.height / GRID_SIZE;
      return { x: c * cellW + cellW/2, y: r * cellH + cellH/2 };
    };

    const drawLine = (p1, p2, color) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      const w = Math.min(canvas.width, canvas.height) / GRID_SIZE;
      ctx.lineWidth = w * 0.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color + '80'; 
      ctx.stroke();
      
      ctx.lineWidth = w * 0.15;
      ctx.strokeStyle = color;
      ctx.stroke();
    };

    // Linhas confirmadas
    drawnLines.forEach(line => {
      const p1 = getCenter(line.start.r, line.start.c);
      const p2 = getCenter(line.end.r, line.end.c);
      drawLine(p1, p2, line.color);
    });

    // Linha atual arrastando
    if (isDragging && startCell && hoverCell) {
      const p1 = getCenter(startCell.r, startCell.c);
      const p2 = getCenter(hoverCell.r, hoverCell.c);
      drawLine(p1, p2, teamColor);
    }
    
  }, [drawnLines, isDragging, startCell, hoverCell, teamColor]);

  // Pointer events
  const getCellFromEvent = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !el.dataset.r) return null;
    return { r: parseInt(el.dataset.r), c: parseInt(el.dataset.c) };
  };

  // Declare triggerError BEFORE the useEffect that captures it so the React
  // Compiler can analyse the reference correctly (const declarations are not
  // hoisted, so referencing them earlier causes a react-hooks/immutability error).
  const triggerError = () => {
    // Shake effect
    containerRef.current.classList.add('error-shake');
    setTimeout(() => {
      if (containerRef.current) containerRef.current.classList.remove('error-shake');
    }, 500);

    // Mostra dica e falha
    setShowHint(true);
    setTimeout(() => onComplete(false), 2000);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      const cell = getCellFromEvent(e);
      if (cell && (!hoverCell || hoverCell.r !== cell.r || hoverCell.c !== cell.c)) {
        setHoverCell(cell);
      }
    };

    const handleUp = (e) => {
      if (!isDragging) return;
      setIsDragging(false);

      let endCell = hoverCell;
      const cellOver = getCellFromEvent(e);
      if (cellOver) endCell = cellOver;

      if (startCell && endCell) {
        const check = validateSelection(startCell, endCell, answerCoords);
        if (check.valid) {
          // Sucesso!
          setDrawnLines(prev => [...prev, { start: startCell, end: endCell, color: teamColor }]);
          setFoundCoords(prev => [...prev, ...check.coords]);
          setTimeout(() => onComplete(true), 800);
        } else {
          // Erro
          triggerError();
        }
      }

      setStartCell(null);
      setHoverCell(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, hoverCell, startCell, answerCoords, onComplete, teamColor]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerDown = (r, c) => {
    setIsDragging(true);
    setStartCell({r, c});
    setHoverCell({r, c});
  };

  return (
    <div 
      ref={containerRef}
      className="glass"
      style={{
        position: 'relative', width: '100%', aspectRatio: '1',
        display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '4px', padding: '12px', userSelect: 'none', touchAction: 'none',
        transition: 'transform 0.3s'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: 1, borderRadius: 'var(--radius)' }} 
      />
      
      {grid.map((row, r) => row.map((letter, c) => {
        const isHovered = isDragging && hoverCell?.r === r && hoverCell?.c === c;
        const isFound = foundCoords.some(coord => coord.r === r && coord.c === c);
        const isHint = showHint && answerCoords.some(coord => coord.r === r && coord.c === c);

        // Use CSS variables so colors work in both dark and light themes.
        // Hardcoded rgba(255,255,255,…) values were invisible in light mode.
        let bg = 'var(--panel-b)';       // subtle cell bg (dark: faint white, light: faint black)
        let scale = 1;
        let color = 'var(--text)';       // letter color (dark: near-white, light: near-black)

        if (isFound) {
          bg = teamColor;
          color = '#000';
        } else if (isHovered) {
          bg = 'rgba(128,128,128,0.25)'; // neutral mid-grey — visible on both themes
          scale = 1.1;
        } else if (isHint) {
          bg = 'rgba(0,229,255,0.45)';   // teal hint — visible on both themes
          color = '#000';
          scale = 1.05;
        }

        return (
          <div
            key={`${r}-${c}`}
            data-r={r} data-c={c}
            onPointerDown={() => handlePointerDown(r, c)}
            className="cell-reveal"
            style={{
              background: bg,
              borderRadius: '6px',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: 'clamp(1rem, 1.8vw, 1.5rem)', fontWeight: '800',
              color: color,
              transform: `scale(${scale})`,
              transition: 'all 0.2s',
              zIndex: isHovered ? 3 : 2,
              position: 'relative',
              animationDelay: `${(r+c)*15}ms`,
              boxShadow: isHint ? `0 0 15px rgba(0,229,255,0.6)` : 'none'
            }}
          >
            {letter}
          </div>
        );
      }))}
      
      <style>{`
        .error-shake { animation: shake 0.5s; }
      `}</style>
    </div>
  );
}
