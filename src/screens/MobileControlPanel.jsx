import { useBetsOdds } from '../hooks/useBetsOdds';
import { useGame } from '../hooks/useGame';

const BET_GAMES = [
  { id: 'cassino', icon: '🎰', name: 'Cassino', color: 'var(--t4)' },
  { id: 'cassino_inst', icon: '⛑️', name: 'Cassino Institucional', color: 'var(--t1)' },
  { id: 'crash',   icon: '✈️', name: 'Aviãozinho', color: 'var(--t2)' },
  { id: 'lootbox', icon: '📦', name: 'Loot Box',   color: 'var(--t1)' },
  { id: 'roleta',  icon: '🎡', name: 'Roleta',     color: 'var(--t3)' },
];

const MODE_LABELS = {
  cassino: '🎰 Cassino',
  cassino_inst: '⛑️ Cassino Institucional',
  crash: '✈️ Aviãozinho',
  lootbox: '📦 Loot Box',
  roleta: '🎡 Roleta',
  cacapalavras: '🔍 Caça-Palavras',
  quiz_tempo: '⚡ Quiz Tempo',
  forca: '🔤 Forca',
  eliminacao: '🧩 Eliminação',
  corrida: '🏃 Corrida',
  bomba: '💣 Bomba',
  duelo: '⚔️ Duelo',
};

export default function MobileControlPanel() {
  const { odds, setOdd } = useBetsOdds();
  const { gameState, togglePause } = useGame();

  const isPlaying = gameState.status === 'playing';
  const isBetsMode = ['cassino', 'cassino_inst', 'crash', 'lootbox', 'roleta'].includes(gameState.gameMode);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px 16px 40px',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: '8px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🎮</div>
        <h1 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--t1)', fontWeight: '800', letterSpacing: '0.05em' }}>
          GAME MASTER
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '4px 0 0' }}>
          Painel de controle remoto
        </p>
      </div>

      {/* Status do jogo */}
      <div className="glass" style={{
        padding: '16px 20px',
        borderRadius: '16px',
        border: `1px solid ${isPlaying ? 'var(--t3)' : 'var(--panel-b)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Status
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: isPlaying ? 'var(--t3)' : 'var(--muted)', marginTop: '2px' }}>
            {isPlaying
              ? (gameState.paused ? '⏸ Pausado' : `▶ ${MODE_LABELS[gameState.gameMode] || gameState.gameMode}`)
              : '⏹ Aguardando jogo'}
          </div>
          {isPlaying && gameState.teams?.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
              {gameState.teams.map(t => t.name).join(' · ')}
            </div>
          )}
        </div>

        {isPlaying && (
          <button
            onClick={togglePause}
            style={{
              background: gameState.paused ? 'var(--t3)' : 'var(--panel-b)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '1.4rem',
              cursor: 'pointer',
              flexShrink: 0,
              color: gameState.paused ? '#000' : 'var(--text)',
            }}
          >
            {gameState.paused ? '▶' : '⏸'}
          </button>
        )}
      </div>

      {/* Placar em tempo real */}
      {isPlaying && gameState.teams?.length > 0 && (
        <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Placar
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...gameState.teams]
              .sort((a, b) => b.score - a.score)
              .map((team, rank) => (
                <div key={team.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '10px',
                  background: rank === 0 ? 'rgba(255,189,51,0.1)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${rank === 0 ? 'rgba(255,189,51,0.3)' : 'transparent'}`,
                }}>
                  <span style={{ fontSize: '1rem', width: '20px' }}>
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`}
                  </span>
                  <span style={{ flex: 1, fontWeight: '700', fontSize: '0.95rem' }}>{team.name}</span>
                  <span style={{ fontWeight: '800', color: 'var(--t3)', fontFamily: 'monospace', fontSize: '1rem' }}>
                    {isBetsMode ? `R$ ${Math.floor(team.score)}` : team.score}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sliders de probabilidade */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
          ⚙️ Probabilidades dos Jogos de Bets
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {BET_GAMES.map(game => (
            <div key={game.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: game.color, fontWeight: '700', fontSize: '0.95rem' }}>
                  {game.icon} {game.name}
                </span>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.82rem', fontWeight: '700' }}>
                  <span style={{ color: 'var(--t3)' }}>✅ {odds[game.id]}%</span>
                  <span style={{ color: 'var(--muted)' }}>🏦 {100 - odds[game.id]}%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={99}
                value={odds[game.id]}
                onChange={e => setOdd(game.id, e.target.value)}
                style={{
                  width: '100%',
                  accentColor: game.color,
                  height: '6px',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                <span>0% jogador</span>
                <span>99% jogador</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '16px 0 0', textAlign: 'center' }}>
          Alterações são aplicadas imediatamente no jogo em exibição.
        </p>
      </div>

    </div>
  );
}
