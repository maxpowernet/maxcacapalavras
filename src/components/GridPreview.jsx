import { useMemo } from 'react';
import { generateGrid } from '../utils/wordGrid';

/**
 * Previa da grade do caça-palavras para uma palavra.
 *
 * Serve para o instrutor conferir, ainda na revisão, que a palavra realmente
 * cabe e aparece na grade — o caso que antes só se descobria jogando, quando
 * a tela pedia uma palavra que a grade não continha.
 */
/** @param {{word: string}} props */
export default function GridPreview({ word }) {
  const { grid, answerCoords, word: placed } = useMemo(() => generateGrid(word), [word]);

  if (!placed) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: 0 }}>
        Sem palavra válida, a grade não pode ser gerada.
      </p>
    );
  }

  const marked = new Set(answerCoords.map((c) => `${c.r}-${c.c}`));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div
        role="img"
        aria-label={`Prévia da grade com a palavra ${placed}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
          gap: '1px',
          maxWidth: '260px',
          fontSize: '0.55rem',
          lineHeight: 1.4,
          fontFamily: 'monospace',
        }}
      >
        {grid.map((row, r) => row.map((letter, c) => {
          const isAnswer = marked.has(`${r}-${c}`);
          return (
            <span
              key={`${r}-${c}`}
              style={{
                textAlign: 'center',
                borderRadius: '2px',
                background: isAnswer ? 'var(--t3)' : 'rgba(255,255,255,0.04)',
                color: isAnswer ? '#000' : 'var(--muted)',
                fontWeight: isAnswer ? 700 : 400,
              }}
            >
              {letter}
            </span>
          );
        }))}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', margin: 0 }}>
        {placed} · {placed.length} letras
      </p>
    </div>
  );
}
