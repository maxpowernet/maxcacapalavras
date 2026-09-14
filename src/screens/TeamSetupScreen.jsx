import { useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import { useClasses } from '../hooks/useClasses';
import { useGames } from '../hooks/useGames';
import { useDialog } from '../hooks/useDialog';

const GAME_MODES = [
  { id: 'cacapalavras', icon: '🔍', name: 'Caça-Palavras', desc: 'Quiz + encontre a palavra no grid', color: 'var(--t1)' },
  { id: 'quiz_tempo', icon: '⚡', name: 'Quiz por Tempo', desc: 'Buzzer simultâneo, mais rápido pontua mais', color: 'var(--t2)' },
  { id: 'forca', icon: '🔤', name: 'Forca em Equipe', desc: 'Quiz + adivinhe a palavra letra a letra', color: 'var(--t3)' },
  { id: 'eliminacao', icon: '🧩', name: 'Quiz Eliminação', desc: '5 perguntas seguidas estilo Milionário', color: 'var(--t4)' },
  { id: 'corrida', icon: '🏃', name: 'Corrida do Saber', desc: 'Tabuleiro de 30 casas, avance por acertos', color: 'var(--t1)' },
  { id: 'duelo', icon: '⚔️', name: 'Modo Duelo', desc: 'Buzzer direto, quem acertar primeiro ganha', color: 'var(--t3)' },
];

export default function TeamSetupScreen({ onStart, onCancel }) {
  const { classes } = useClasses();
  const { games, getGamesByClass } = useGames();
  const dialog = useDialog();

  // Bug fix: read sessionStorage synchronously in the initializer so we never
  // call setState inside a useEffect (which triggers set-state-in-effect errors).
  const [selectedClassId, setSelectedClassId] = useState(
    () => sessionStorage.getItem('mcp_active_class_id') || ''
  );
  const [selectedGameId, setSelectedGameId] = useState(
    () => sessionStorage.getItem('mcp_active_game_id') || ''
  );
  const [selectedMode, setSelectedMode] = useState('cacapalavras');

  const [teams, setTeams] = useState([
    { name: '', memberIds: [] }, { name: '', memberIds: [] },
    { name: '', memberIds: [] }, { name: '', memberIds: [] },
  ]);

  // Bug fix: derive availableGames inline instead of syncing it via useEffect.
  // A computed value is always in sync with selectedClassId and games without
  // any setState calls, eliminating set-state-in-effect lint errors.
  const availableGames = selectedClassId ? getGamesByClass(selectedClassId) : [];

  const students = classes.find(c => c.id === selectedClassId)?.students || [];

  const updateName = (index, value) => {
    // Antes era copia rasa + mutacao do objeto da equipe.
    setTeams(prev => prev.map((t, i) => (i === index ? { ...t, name: value } : t)));
  };

  // Cada aluno pertence a no maximo uma equipe; -1 = fora da partida.
  const teamOfStudent = (studentId) => teams.findIndex(t => t.memberIds.includes(studentId));

  const assignStudent = (studentId, teamIdx) => {
    setTeams(prev => prev.map((t, i) => {
      const without = t.memberIds.filter(id => id !== studentId);
      return { ...t, memberIds: i === teamIdx ? [...without, studentId] : without };
    }));
  };

  const handleStart = () => {
    if (!selectedClassId || !selectedGameId) {
      dialog.alert('Selecione a turma e o jogo antes de iniciar.');
      return;
    }
    const validTeams = teams
      .filter(t => t.name.trim().length > 0)
      .map(t => ({ name: t.name.trim(), memberIds: t.memberIds }));
    if (validTeams.length < 2) {
      dialog.alert('Sao necessarias pelo menos 2 equipes para jogar.');
      return;
    }
    sessionStorage.setItem('mcp_active_class_id', selectedClassId);
    sessionStorage.setItem('mcp_active_game_id', selectedGameId);
    const selectedGame = games.find(g => g.id === selectedGameId);
    onStart(validTeams, selectedGame, selectedMode);
  };

  const colors = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];
  const labels = ['Equipe 1 (Ciano)', 'Equipe 2 (Rosa)', 'Equipe 3 (Verde) - Opcional', 'Equipe 4 (Ambar) - Opcional'];

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
      <div className="glass animate-slide" style={{ width: '100%', maxWidth: '780px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BrandLogo />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2>Configurar Partida</h2>
          <p>Selecione turma, jogo, modo e as equipes participantes.</p>
        </div>

        {/* Turma + Jogo */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className="input-wrap" style={{ flex: 1 }}>
            <label className="input-label" htmlFor="setup-turma">Turma</label>
            <select id="setup-turma" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'inherit', border: '1px solid var(--panel-b)' }}>
              <option value="">Selecione a turma...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-wrap" style={{ flex: 1 }}>
            <label className="input-label" htmlFor="setup-jogo">Jogo / Quiz</label>
            <select id="setup-jogo" value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}
              disabled={!selectedClassId}
              style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'inherit', border: '1px solid var(--panel-b)', opacity: !selectedClassId ? 0.5 : 1 }}>
              <option value="">Selecione o jogo...</option>
              {availableGames.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        {/* Modo de Jogo */}
        <div>
          <span className="input-label" style={{ display: 'block', marginBottom: '12px' }}>Modo de Jogo</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {GAME_MODES.map(m => {
              const isSelected = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  style={{
                    background: isSelected ? `${m.color}22` : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${isSelected ? m.color : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    padding: '14px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text)',
                    transition: 'all 0.2s',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: isSelected ? `0 0 16px ${m.color}50` : 'none',
                    fontFamily: 'var(--font)',
                  }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{m.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: isSelected ? m.color : 'var(--text)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '3px', lineHeight: '1.3' }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Equipes */}
        <div style={{ borderTop: '1px solid var(--panel-b)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span className="input-label" style={{ marginBottom: '-5px' }}>Equipes</span>
          {teams.map((team, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <input
                type="text"
                value={team.name}
                onChange={e => updateName(idx, e.target.value)}
                placeholder={labels[idx]}
                aria-label={labels[idx]}
                style={{
                  borderColor: team.name ? colors[idx] : 'var(--panel-b)',
                  boxShadow: team.name ? `0 0 10px ${colors[idx]}40` : 'none',
                  padding: '12px 40px 12px 15px',
                  width: '100%',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text)',
                  outline: 'none',
                  border: `1px solid ${team.name ? colors[idx] : 'var(--panel-b)'}`,
                  fontFamily: 'var(--font)',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                }}
              />
              <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', borderRadius: '50%', background: colors[idx] }} />
            </div>
          ))}
        </div>

        {/* Alunos — so aparece quando a turma tem cadastro. Sem isso o jogo
            continua funcionando normalmente, so sem relatorio individual. */}
        {students.length > 0 && (
          <div style={{ borderTop: '1px solid var(--panel-b)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span className="input-label">Alunos nas equipes</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '4px 0 0' }}>
                Opcional. Distribua os alunos para gerar o relatorio de desempenho individual.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '6px', maxHeight: '260px', overflowY: 'auto', paddingRight: '6px' }}>
              {students.map(st => {
                const assigned = teamOfStudent(st.id);
                return (
                  <div key={st.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '8px 12px',
                  }}>
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>{st.name}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {teams.map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={!t.name.trim()}
                          aria-pressed={assigned === idx}
                          aria-label={`Colocar ${st.name} na equipe ${idx + 1}`}
                          onClick={() => assignStudent(st.id, assigned === idx ? -1 : idx)}
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px', cursor: t.name.trim() ? 'pointer' : 'not-allowed',
                            background: assigned === idx ? colors[idx] : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${assigned === idx ? colors[idx] : 'var(--panel-b)'}`,
                            color: assigned === idx ? '#000' : 'var(--muted)',
                            fontWeight: '700', fontSize: '0.8rem',
                            opacity: t.name.trim() ? 1 : 0.35,
                          }}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Voltar</button>
          <button className="btn btn-primary" onClick={handleStart} style={{ flex: 2 }}>Iniciar Jogo</button>
        </div>

      </div>
    </div>
  );
}
