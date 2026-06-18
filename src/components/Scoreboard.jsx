import { useAppContext } from '../context/AppContext';

const COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];

export default function Scoreboard({ teams }) {
  const { gameState } = useAppContext();
  const maxScore = gameState?.winGoal || 100;

  return (
    <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '4px', letterSpacing: '1px' }}>
        PLACAR GERAL
      </h3>
      {teams.map((t, idx) => {
        const color = COLORS[idx % 4];
        const pct = Math.min(100, (t.score / maxScore) * 100);
        
        return (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color, fontWeight: '600', fontSize: '0.9rem' }}>{t.name}</span>
              <span style={{ color, fontWeight: '800', fontSize: '0.9rem' }}>{t.score}</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.5s ease-out' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
