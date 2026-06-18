
const SPECIAL_INFO = {
  star:            { icon: '⭐', label: 'Estrela!',       desc: '+2 casas extras', color: '#FFD700' },
  trap:            { icon: '💣', label: 'Armadilha!',     desc: 'Volta 2 casas',  color: '#FF3355' },
  bonus_question:  { icon: '🔄', label: 'Desafio Bônus!', desc: 'Pergunta extra', color: '#00F2FF' },
  stop:            { icon: '🛑', label: 'Pare!',          desc: 'Perde o próximo turno', color: '#FF007A' },
};

export default function BoardGame({ positions, teams, specialSquares = [], totalSquares = 30 }) {
  const COLS = 10;
  const ROWS = Math.ceil(totalSquares / COLS);

  const COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33'];

  // Gera array de casas na ordem de serpentina
  const squares = [];
  for (let row = 0; row < ROWS; row++) {
    const rowSquares = [];
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      if (idx < totalSquares) rowSquares.push(idx);
    }
    // Serpentina: linhas ímpares invertidas
    squares.push(...(row % 2 === 1 ? rowSquares.reverse() : rowSquares));
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${COLS}, 1fr)`,
      gap: '4px',
      width: '100%',
    }}>
      {squares.map((idx) => {
        const special = specialSquares.find(s => s.index === idx);
        const teamsHere = teams.filter((_, ti) => positions[ti] === idx);
        const isFinish = idx === totalSquares - 1;
        const isStart = idx === 0;

        return (
          <div
            key={idx}
            style={{
              aspectRatio: '1',
              borderRadius: '6px',
              background: isFinish ? 'rgba(255,215,0,0.3)'
                : isStart ? 'rgba(57,255,20,0.15)'
                : special ? `${SPECIAL_INFO[special.type]?.color ?? '#fff'}22`
                : 'var(--panel-b)',
              border: `1px solid ${
                isFinish ? '#FFD700'
                : isStart ? '#39FF14'
                : special ? `${SPECIAL_INFO[special.type]?.color ?? '#fff'}66`
                : 'var(--panel-b)'
              }`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              position: 'relative',
              transition: 'all 0.3s',
              overflow: 'hidden',
            }}
          >
            {/* Número */}
            <span style={{ color: 'var(--muted)', fontSize: '0.5rem', position: 'absolute', top: '2px', left: '3px' }}>
              {idx}
            </span>

            {/* Ícone de casa especial */}
            {special && (
              <span style={{ fontSize: '0.9rem' }}>{SPECIAL_INFO[special.type]?.icon}</span>
            )}
            {isFinish && <span style={{ fontSize: '0.9rem' }}>🏁</span>}
            {isStart && !special && <span style={{ fontSize: '0.7rem' }}>🏠</span>}

            {/* Tokens das equipes */}
            {teamsHere.length > 0 && (
              <div style={{
                position: 'absolute', bottom: '2px',
                display: 'flex', gap: '1px', flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {teamsHere.map((_, i) => {
                  const teamIdx = positions.indexOf(idx, i === 0 ? 0 : positions.indexOf(idx) + 1);
                  return (
                    <div
                      key={i}
                      style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: COLORS[teamIdx % 4],
                        boxShadow: `0 0 4px ${COLORS[teamIdx % 4]}`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { SPECIAL_INFO };
