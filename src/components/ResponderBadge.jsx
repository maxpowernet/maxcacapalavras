import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useAppContext } from '../context/AppContext';

/**
 * Mostra qual aluno responde por esta equipe no turno atual.
 *
 * As perguntas sao da equipe, entao creditar o acerto a todos os membros nao
 * seria dado real. O respondente entra em rodizio a cada turno e pode ser
 * trocado com um clique — e o que torna o relatorio individual honesto.
 *
 * Nao renderiza nada quando a turma nao tem alunos distribuidos.
 */
export default function ResponderBadge() {
  const { gameState, setResponder } = useGame();
  const { classes } = useAppContext();
  const [open, setOpen] = useState(false);

  const team = gameState.teams?.[gameState.currentTeamIndex];
  const memberIds = team?.memberIds || [];
  if (memberIds.length === 0) return null;

  const students = classes.find((c) => c.id === gameState.classId)?.students || [];
  const nameOf = (id) => students.find((s) => s.id === id)?.name || 'Aluno removido';

  return (
    <div className="glass" style={{ padding: '14px', textAlign: 'center' }}>
      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: '6px' }}>
        Responde agora
      </span>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', font: 'inherit',
          color: 'var(--text)', fontWeight: '700', fontSize: '1.05rem',
        }}
      >
        {nameOf(gameState.currentResponderId)} <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>▼</span>
      </button>

      {open && (
        <div style={{ display: 'grid', gap: '4px', marginTop: '10px' }}>
          {memberIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => { setResponder(id); setOpen(false); }}
              style={{
                font: 'inherit', fontSize: '0.85rem', cursor: 'pointer',
                padding: '6px 8px', borderRadius: '6px',
                background: id === gameState.currentResponderId ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: '1px solid var(--panel-b)', color: 'var(--text)',
              }}
            >
              {nameOf(id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
