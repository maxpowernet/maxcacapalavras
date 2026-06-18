
const MODE_NAMES = {
  cacapalavras: '🔍 Caça-Palavras',
  quiz_tempo: '⚡ Quiz por Tempo',
  forca: '🔤 Forca em Equipe',
  eliminacao: '🧩 Quiz Eliminação',
  corrida: '🏃 Corrida do Saber',
  bomba: '💣 Bomba Relógio',
  duelo: '⚔️ Modo Duelo',
};

export default function PrintReport({ record, gameName, className, onClose }) {
  const sortedTeams = record.teams ? [...record.teams].sort((a, b) => b.score - a.score) : [];

  const formatTime = (s) => {
    if (!s) return '--';
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <>
      {/* Modal overlay (apenas na tela, some ao imprimir) */}
      <div className="print-hide" style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
        <div style={{
          background: '#fff', color: '#111', borderRadius: '12px',
          width: '100%', maxWidth: '600px', maxHeight: '90vh',
          overflowY: 'auto', padding: '40px',
          fontFamily: 'Arial, sans-serif',
        }}>
          <div id="print-content">
            {/* Cabeçalho */}
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
              <h1 style={{ fontSize: '1.8rem', margin: '0 0 4px' }}>Max Caça Palavras</h1>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>SENAI CT Gurupi</div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '4px' }}>Relatório de Partida</div>
            </div>

            {/* Informações */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                ['Jogo', gameName || 'Jogo Removido'],
                ['Turma', className || 'Turma Removida'],
                ['Modo', MODE_NAMES[record.gameMode] || record.gameMode || 'Caça-Palavras'],
                ['Data', new Date(record.date).toLocaleDateString('pt-BR')],
                ['Horário', new Date(record.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })],
                ['Duração', formatTime(record.durationSeconds)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f8f8f8', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111', marginTop: '2px' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Ranking */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Ranking Final
              </h3>
              {sortedTeams.map((t, i) => (
                <div key={t.id ?? i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', marginBottom: '8px',
                  background: i === 0 ? '#FFF9E6' : '#f9f9f9',
                  border: i === 0 ? '1px solid #FFD700' : '1px solid #eee',
                  borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '900', fontSize: '1.2rem', color: i === 0 ? '#B8860B' : '#999' }}>#{i + 1}</span>
                    <span style={{ fontWeight: '600' }}>{t.name}</span>
                    {i === 0 && <span>🏆</span>}
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: i === 0 ? '#B8860B' : '#333' }}>
                    {t.score} pts
                  </span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              Gerado em {new Date().toLocaleString('pt-BR')} · Max Caça Palavras
            </div>
          </div>

          <div className="print-hide" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
              Fechar
            </button>
            <button onClick={() => window.print()} style={{ flex: 2, padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
              🖨️ Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print-hide { display: none !important; }
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: fixed; left: 0; top: 0; width: 100%; background: white; color: black; padding: 20mm; }
        }
      `}</style>
    </>
  );
}
