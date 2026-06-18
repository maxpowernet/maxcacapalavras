import { useState } from 'react';
import { useHistory } from '../../hooks/useHistory';
import { useGames } from '../../hooks/useGames';
import { useClasses } from '../../hooks/useClasses';
import PrintReport from '../../components/PrintReport';

const MODE_LABELS = {
  cacapalavras: '🔍 Caça-Palavras',
  quiz_tempo: '⚡ Quiz Tempo',
  forca: '🔤 Forca',
  eliminacao: '🧩 Eliminação',
  corrida: '🏃 Corrida',
  bomba: '💣 Bomba',
  duelo: '⚔️ Duelo',
};

const MODE_COLORS = {
  cacapalavras: '#00F2FF',
  quiz_tempo: '#FFBD33',
  forca: '#FF007A',
  eliminacao: '#AA88FF',
  corrida: '#39FF14',
  bomba: '#FF6633',
  duelo: '#33CCFF',
};

const MEDALS = ['🥇', '🥈', '🥉'];

export default function HistoryView() {
  const { history, clearHistory } = useHistory();
  const { games } = useGames();
  const { classes } = useClasses();
  const [printRecord, setPrintRecord] = useState(null);

  const formatTime = (seconds) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {printRecord && (
        <PrintReport
          record={printRecord}
          gameName={games.find(g => g.id === printRecord.gameId)?.name}
          className={classes.find(c => c.id === printRecord.classId)?.name}
          onClose={() => setPrintRecord(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className="gradient-title">Histórico de Partidas</h1>
          <p>Ranking e detalhes de todas as partidas finalizadas.</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={() => {
            if (window.confirm('Apagar todo o histórico? Esta ação não pode ser desfeita.')) clearHistory();
          }}>🗑️ Limpar Histórico</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass" style={{ padding: '50px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
          O histórico está vazio.
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <div className="glass" style={{ padding: '18px 20px', borderLeft: `4px solid var(--t1)`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.3rem' }}>🏆</div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--t1)' }}>{history.length}</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Partidas Registradas</div>
            </div>
            <div className="glass" style={{ padding: '18px 20px', borderLeft: `4px solid var(--t2)`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.3rem' }}>⏱️</div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--t2)' }}>{formatTime(history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0))}</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Tempo Total Jogado</div>
            </div>
            <div className="glass" style={{ padding: '18px 20px', borderLeft: `4px solid var(--t3)`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.3rem' }}>🎯</div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--t3)' }}>{Math.max(0, ...history.flatMap(h => h.teams?.map(t => t.score) || [0]))}</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Maior Pontuação</div>
            </div>
          </div>

          {/* Lista de Partidas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {history.map(h => {
              const game = games.find(g => g.id === h.gameId);
              const cls = classes.find(c => c.id === h.classId);
              const sortedTeams = h.teams ? [...h.teams].sort((a, b) => b.score - a.score) : [];
              const modeColor = MODE_COLORS[h.gameMode] || MODE_COLORS.cacapalavras;

              return (
                <div key={h.id} className="glass" style={{
                  padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px',
                  borderLeft: `4px solid ${modeColor}`,
                  boxShadow: `0 4px 20px ${modeColor}18`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-b)', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                        background: `${modeColor}1a`, border: `1px solid ${modeColor}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                      }}>
                        {(MODE_LABELS[h.gameMode] || MODE_LABELS.cacapalavras).split(' ')[0]}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px' }}>{game?.name || 'Jogo Removido'}</h3>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          {cls?.name || 'Turma Removida'} &nbsp;·&nbsp;
                          <span style={{ color: modeColor }}>{(MODE_LABELS[h.gameMode] || MODE_LABELS.cacapalavras).split(' ').slice(1).join(' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <div style={{ fontWeight: '700', color: modeColor, fontSize: '0.85rem' }}>
                        {new Date(h.date).toLocaleDateString('pt-BR')} às {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Duração: {formatTime(h.durationSeconds)}</div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPrintRecord(h)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        🖨️ Exportar PDF
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: 'var(--muted)' }}>RANKING FINAL:</div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {sortedTeams.map((t, idx) => (
                        <div key={t.name} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 15px', borderRadius: '6px',
                          background: idx === 0 ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.2)',
                          border: idx === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
                          color: idx === 0 ? '#FFD700' : 'inherit'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>{MEDALS[idx] || `#${idx + 1}`}</strong> {t.name}
                          </span>
                          <span style={{ fontWeight: '800' }}>{t.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
