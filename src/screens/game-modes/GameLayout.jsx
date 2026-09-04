import { useGame } from '../../hooks/useGame';
import BrandLogo from '../../components/BrandLogo';
import PlayerCard from '../../components/PlayerCard';
import Scoreboard from '../../components/Scoreboard';

const COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];
const HEX_COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33'];

export function GameLayout({ children, rightPanel, currentTeamIndex, teams, hideSidebars = false }) {
  const { togglePause } = useGame();
  const activeColor = COLORS[currentTeamIndex % 4];
  const currentTeam = teams[currentTeamIndex];

  if (hideSidebars) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'clamp(10px, 2vh, 20px)', gap: '16px' }}>
        <div className="glass" style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <BrandLogo small interactive onClick={togglePause} />
        </div>
        {children}
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', padding: 'clamp(10px, 2vh, 20px)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '1600px', margin: '0 auto', gap: '20px' }}>

        {/* Left Sidebar */}
        <aside style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px', maxWidth: '260px' }}>
          <div className="glass" style={{ display: 'flex', justifyContent: 'center' }}>
            <BrandLogo interactive onClick={togglePause} />
          </div>
          <h2 style={{ fontSize: '1rem', letterSpacing: '2px', color: 'var(--muted)', textAlign: 'center' }}>EQUIPES</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {teams.map((t, idx) => (
              <PlayerCard key={t.id} team={t} isActive={idx === currentTeamIndex} />
            ))}
          </div>
        </aside>

        {/* Center */}
        <main style={{ flex: '2', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', overflow: 'hidden' }}>
          {children}
        </main>

        {/* Right Sidebar */}
        <aside style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px', maxWidth: '260px' }}>
          <Scoreboard teams={teams} />
          <div className="glass" style={{
            padding: '20px', textAlign: 'center',
            background: activeColor, boxShadow: `0 0 24px ${activeColor}50`,
          }}>
            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
              Turno de:
            </span>
            <h2 style={{ fontSize: '1.6rem', color: '#000' }}>{currentTeam?.name}</h2>
          </div>
          {rightPanel}
        </aside>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export { COLORS, HEX_COLORS };
