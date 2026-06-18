import { useAppContext } from '../context/AppContext';

const COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];

export default function PlayerCard({ team, isActive }) {
  const { gameState } = useAppContext();
  const maxScore = gameState?.winGoal || 100;
  
  const color = COLORS[team.id % 4];
  const pct = Math.min(100, (team.score / maxScore) * 100);

  return (
    <div style={{
      position: 'relative',
      background: 'var(--panel)',
      border: `1px solid ${isActive ? color : 'var(--panel-b)'}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '12px',
      padding: '16px',
      overflow: 'hidden',
      opacity: isActive ? 1 : 0.6,
      boxShadow: isActive ? `0 0 20px ${color}40` : 'none',
      transition: 'all 0.3s',
      display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      {/* Wave animation for active player */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.15,
          background: `radial-gradient(circle at 50% 150%, ${color} 0%, transparent 60%)`,
          animation: 'pulse 2s infinite'
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '700', fontSize: '1.05rem' }}>{team.name}</span>
        <span style={{ 
          background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '6px', 
          fontWeight: '800', border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          {team.score} pts
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', width: `${pct}%`, background: color, 
          boxShadow: `0 0 10px ${color}`, transition: 'width 0.5s ease-out' 
        }} />
      </div>
    </div>
  );
}
