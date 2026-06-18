import { useClasses } from '../../hooks/useClasses';
import { useGames } from '../../hooks/useGames';
import { useHistory } from '../../hooks/useHistory';
import BarChart from '../../components/charts/BarChart';

const STAT_CARDS = [
  { icon: '👥', color: 'var(--t1)', key: 'classes', label: 'Turmas' },
  { icon: '🕹️', color: 'var(--t2)', key: 'games', label: 'Jogos' },
  { icon: '🏆', color: 'var(--t3)', key: 'history', label: 'Partidas' },
  { icon: '⏱️', color: 'var(--t4)', key: 'time', label: 'Tempo Total' },
];

const MODE_LABELS = {
  cacapalavras: 'Caça-Palavras',
  quiz_tempo: 'Quiz Tempo',
  forca: 'Forca',
  eliminacao: 'Eliminação',
  corrida: 'Corrida',
  bomba: 'Bomba',
  duelo: 'Duelo',
};

const COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33', '#AA88FF', '#FF6633', '#33CCFF'];

const MODE_ICONS = {
  cacapalavras: '🔍',
  quiz_tempo: '⚡',
  forca: '🔤',
  eliminacao: '🧩',
  corrida: '🏃',
  bomba: '💣',
  duelo: '⚔️',
};

export default function DashboardView({ onNavigate }) {
  const { classes } = useClasses();
  const { games } = useGames();
  const { history } = useHistory();

  const totalTimePlayed = history.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);

  const formatTime = (seconds) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const statValues = {
    classes: classes.length,
    games: games.length,
    history: history.length,
    time: formatTime(totalTimePlayed),
  };

  // Gráfico 1: Partidas por modo
  const modeCount = {};
  history.forEach(h => {
    const m = h.gameMode || 'cacapalavras';
    modeCount[m] = (modeCount[m] || 0) + 1;
  });
  const modeChartData = Object.entries(modeCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key, val], i) => ({ label: MODE_LABELS[key] || key, value: val, color: COLORS[i % COLORS.length] }));

  // Gráfico 2: Pontuação máxima por turma
  const classScoreMap = {};
  history.forEach(h => {
    if (!h.classId || !h.teams) return;
    const cls = classes.find(c => c.id === h.classId);
    if (!cls) return;
    const maxScore = Math.max(...h.teams.map(t => t.score));
    classScoreMap[cls.name] = Math.max(classScoreMap[cls.name] || 0, maxScore);
  });
  const classChartData = Object.entries(classScoreMap)
    .map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));

  // Gráfico 3: Partidas por mês (últimos 6 meses)
  const monthCount = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    monthCount[key] = 0;
  }
  history.forEach(h => {
    if (!h.date) return;
    const d = new Date(h.date);
    const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    if (key in monthCount) monthCount[key]++;
  });
  const monthChartData = Object.entries(monthCount).map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 className="gradient-title">Visão Geral</h1>
        <p>Acompanhe o desempenho e os números das suas turmas.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {STAT_CARDS.map(card => (
          <div key={card.key} className="glass" style={{
            padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px',
            borderLeft: `4px solid ${card.color}`,
            boxShadow: `0 4px 20px ${card.color}18`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.3rem' }}>{card.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: card.color }}>{statValues[card.key]}</div>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {history.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {modeChartData.length > 0 && (
              <div className="glass" style={{ padding: '16px 20px', borderLeft: `4px solid ${COLORS[0]}` }}>
                <BarChart title="Modos Mais Jogados" data={modeChartData} horizontal />
              </div>
            )}
            {classChartData.length > 0 && (
              <div className="glass" style={{ padding: '16px 20px', borderLeft: `4px solid ${COLORS[1]}` }}>
                <BarChart title="Pontuação Máx. por Turma" data={classChartData} horizontal />
              </div>
            )}
          </div>
          {monthChartData.some(d => d.value > 0) && (
            <div className="glass" style={{ padding: '24px', borderLeft: `4px solid ${COLORS[2]}` }}>
              <BarChart title="Partidas por Mês" data={monthChartData} height={220} />
            </div>
          )}
        </>
      )}

      {/* Últimas Partidas */}
      <div className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Últimas Partidas</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('history')}>Ver Todas</button>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            Nenhuma partida registrada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.slice(0, 5).map(h => {
              const game = games.find(g => g.id === h.gameId);
              const cls = classes.find(c => c.id === h.classId);
              const winner = h.teams?.length > 0 ? [...h.teams].sort((a, b) => b.score - a.score)[0] : { name: '—', score: 0 };
              return (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--t4)' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>
                      {game?.name || 'Jogo Removido'} <span title={MODE_LABELS[h.gameMode] || 'Caça-Palavras'}>{MODE_ICONS[h.gameMode] || MODE_ICONS.cacapalavras}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {cls?.name || 'Turma Removida'} · {MODE_LABELS[h.gameMode] || 'Caça-Palavras'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--t4)', fontWeight: '800' }}>🏆 {winner.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(h.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
