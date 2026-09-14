import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useClasses } from '../hooks/useClasses';
import { useDialog } from '../hooks/useDialog';

/**
 * Cadastro de alunos de uma turma.
 *
 * Os alunos sao a base do relatorio individual: sem eles a partida continua
 * funcionando, mas o desempenho so existe por equipe.
 */
export default function StudentsPanel({ classId, students = [], color }) {
  const { setStudents } = useClasses();
  const dialog = useDialog();
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (next) => {
    setBusy(true);
    try {
      await setStudents(classId, next);
    } catch (err) {
      console.error('Falha ao salvar os alunos:', err);
      dialog.alert('Nao foi possivel salvar os alunos. Verifique sua conexao e tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (students.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      dialog.alert('Ja existe um aluno com esse nome nesta turma.');
      return;
    }
    setNewName('');
    await save([...students, { id: uuidv4(), name }]);
  };

  const rename = async (id, name) => {
    const clean = name.trim();
    if (!clean) return;
    await save(students.map((s) => (s.id === id ? { ...s, name: clean } : s)));
  };

  const remove = async (student) => {
    const ok = await dialog.confirm(`Remover ${student.name} da turma?`, { danger: true, confirmText: 'Remover' });
    if (!ok) return;
    await save(students.filter((s) => s.id !== student.id));
  };

  return (
    <div style={{ borderTop: '1px solid var(--panel-b)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <form onSubmit={add} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div className="input-wrap" style={{ flex: 1, margin: 0 }}>
          <label className="input-label" htmlFor={`novo-aluno-${classId}`}>Novo aluno</label>
          <input
            id={`novo-aluno-${classId}`}
            type="text"
            placeholder="Nome do aluno"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!newName.trim() || busy}>
          + Adicionar
        </button>
      </form>

      {students.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
          Nenhum aluno cadastrado. Sem alunos, o relatorio sai apenas por equipe.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
          {students.map((s) => (
            <li
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '6px 10px',
              }}
            >
              <span aria-hidden="true" style={{ color }}>●</span>
              <input
                type="text"
                defaultValue={s.name}
                aria-label={`Nome de ${s.name}`}
                onBlur={(e) => rename(s.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '2px 0' }}
              />
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => remove(s)}
                disabled={busy}
                aria-label={`Remover ${s.name}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
