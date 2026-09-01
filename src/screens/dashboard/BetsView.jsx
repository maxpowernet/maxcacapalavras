import { useState } from 'react';
import { useBetsOdds } from '../../hooks/useBetsOdds';

const BET_GAMES = [
  { id: 'cassino', icon: '🎰', name: 'Cassino Educacional', desc: 'Simulador de apostas contra a banca', color: 'var(--t4)' },
  { id: 'cassino_inst', icon: '⛑️', name: 'Cassino Institucional', desc: 'Acerte a pergunta sobre a empresa para poder girar', color: 'var(--t1)' },
  { id: 'crash', icon: '✈️', name: 'Aviãozinho', desc: 'Saque antes que o multiplicador estoure', color: 'var(--t2)' },
  { id: 'lootbox', icon: '📦', name: 'Loot Box', desc: 'Compre baús de diferentes raridades', color: 'var(--t1)' },
  { id: 'roleta', icon: '🎡', name: 'Roleta', desc: 'Aposte em cores. Cuidado com o zero verde!', color: 'var(--t3)' },
];

export default function BetsView({ onStartGame }) {
  const [teams, setTeams] = useState([{ name: '' }, { name: '' }, { name: '' }, { name: '' }]);
  const { odds, setOdd } = useBetsOdds();
  const colors = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];
  const labels = ['Equipe 1', 'Equipe 2', 'Equipe 3 (Opcional)', 'Equipe 4 (Opcional)'];

  const updateName = (index, value) => {
    const newTeams = [...teams];
    newTeams[index].name = value;
    setTeams(newTeams);
  };

  const handlePlay = (modeId) => {
    const validTeams = teams.filter(t => t.name.trim().length > 0);
    if (validTeams.length < 2) {
      alert('São necessárias pelo menos 2 equipes para jogar.');
      return;
    }
    // Set dummy active game/class to prevent errors in other components
    sessionStorage.setItem('mcp_active_class_id', 'bets-class');
    sessionStorage.setItem('mcp_active_game_id', 'bets-game');
    
    if (onStartGame) {
      onStartGame(validTeams, modeId);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div className="glass" style={{ padding: '30px', borderRadius: '20px', border: '1px solid var(--t4)' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--t4)', margin: '0 0 10px 0' }}>JOGOS DE BETS</h2>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '1.1rem' }}>
          Módulo de educação financeira sobre risco, ganância e estatística. <br/>
          Configure as equipes abaixo e clique em um jogo para iniciar imediatamente.
        </p>
      </div>

      <div className="glass" style={{ padding: '30px', borderRadius: '20px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', color: 'var(--text)' }}>Equipes Participantes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {teams.map((team, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <input
                type="text"
                value={team.name}
                onChange={e => updateName(idx, e.target.value)}
                placeholder={labels[idx]}
                style={{
                  borderColor: team.name ? colors[idx] : 'var(--panel-b)',
                  padding: '12px 15px', width: '100%', borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)', color: 'var(--text)',
                  outline: 'none', border: `1px solid ${team.name ? colors[idx] : 'var(--panel-b)'}`,
                  fontSize: '1rem'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Configuração de Probabilidade */}
      <details className="glass" style={{ padding: '24px 30px', borderRadius: '20px' }}>
        <summary style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text)', cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚙️ Configurações de Probabilidade
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: '400' }}> — chances reais de vitória do jogador</span>
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '20px' }}>
          {BET_GAMES.map(game => (
            <div key={game.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ color: game.color, width: '180px', fontWeight: '700', fontSize: '0.95rem' }}>
                {game.icon} {game.name}
              </span>
              <input
                type="range" min={0} max={99} value={odds[game.id]}
                onChange={e => setOdd(game.id, e.target.value)}
                style={{ flex: 1, minWidth: '120px', accentColor: game.color }}
              />
              <span style={{ color: 'var(--t3)', fontWeight: '800', width: '48px', textAlign: 'right' }}>
                {odds[game.id]}%
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem', width: '80px' }}>
                Banca: {100 - odds[game.id]}%
              </span>
            </div>
          ))}
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
            Estes valores afetam diretamente a lógica de cada jogo. Salvos automaticamente.
          </p>
        </div>
      </details>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {BET_GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => handlePlay(game.id)}
            style={{
              background: `linear-gradient(135deg, ${game.color}15, rgba(0,0,0,0.5))`,
              border: `2px solid ${game.color}40`,
              borderRadius: '20px', padding: '30px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s', gap: '15px'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = game.color; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = `${game.color}40`; }}
          >
            <div style={{ fontSize: '4.5rem' }}>{game.icon}</div>
            <h3 style={{ color: game.color, fontSize: '1.6rem', margin: 0 }}>{game.name}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>{game.desc}</p>
            <div style={{ marginTop: '10px', background: game.color, color: '#000', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.1rem' }}>
              JOGAR AGORA
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
