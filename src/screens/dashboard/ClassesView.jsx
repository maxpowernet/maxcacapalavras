import { useState } from 'react';
import { useClasses } from '../../hooks/useClasses';
import { useGames } from '../../hooks/useGames';
import BadgesPanel from '../../components/BadgesPanel';

const COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33', '#AA88FF', '#FF6633', '#33CCFF'];

export default function ClassesView() {
  const { classes, addClass, removeClass, updateClass } = useClasses();
  const { getGamesByClass } = useGames();
  const [newClassName, setNewClassName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [expandedBadgeId, setExpandedBadgeId] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (newClassName.trim()) {
      addClass(newClassName.trim());
      setNewClassName('');
    }
  };

  const handleSaveEdit = (id) => {
    if (editName.trim()) updateClass(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 className="gradient-title">Minhas Turmas</h1>
        <p>Gerencie as turmas que participarão dos jogos.</p>
      </div>

      <div className="glass" style={{ padding: '30px' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div className="input-wrap" style={{ flex: 1 }}>
            <label className="input-label">Nova Turma</label>
            <input type="text" placeholder="Ex: 1º Ano A — Matutino" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!newClassName.trim()}>+ Adicionar</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {classes.length === 0 ? (
          <div className="glass" style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>
            Nenhuma turma cadastrada. Crie uma acima para começar.
          </div>
        ) : (
          classes.map((c, i) => {
            const gamesCount = getGamesByClass(c.id).length;
            const isEditing = editingId === c.id;
            const showBadges = expandedBadgeId === c.id;
            const color = COLORS[i % COLORS.length];

            return (
              <div key={c.id} className="glass" style={{
                padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
                borderLeft: `4px solid ${color}`,
                boxShadow: `0 4px 20px ${color}18`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: `${color}1a`, border: `1px solid ${color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                    }}>
                      🎓
                    </div>
                    <div>
                      {isEditing ? (
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit(c.id)}
                          style={{ maxWidth: '300px', marginBottom: '4px' }} autoFocus />
                      ) : (
                        <h3 style={{ marginBottom: '2px' }}>{c.name}</h3>
                      )}
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{gamesCount} jogo(s) vinculado(s)</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedBadgeId(showBadges ? null : c.id)}
                      style={{ borderColor: showBadges ? 'var(--t4)' : undefined, color: showBadges ? 'var(--t4)' : undefined }}
                    >
                      🏆 Conquistas
                    </button>
                    {isEditing ? (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(c.id)}>Salvar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingId(c.id); setEditName(c.name); }}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          if (window.confirm(`Excluir "${c.name}"? Os jogos vinculados ficarão órfãos.`)) removeClass(c.id);
                        }}>Excluir</button>
                      </>
                    )}
                  </div>
                </div>

                {showBadges && (
                  <div style={{ borderTop: '1px solid var(--panel-b)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '12px', letterSpacing: '1px', fontWeight: '700' }}>
                      CONQUISTAS DE {c.name.toUpperCase()}
                    </div>
                    <BadgesPanel classId={c.id} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
