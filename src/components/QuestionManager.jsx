import { useMemo, useState } from 'react';
import { sanitizeWord, MAX_WORD_LEN, MIN_WORD_LEN } from '../utils/wordGrid';
import { findQuestionIssues, countWords } from '../utils/questionValidation';
import { toJSON, toTXT, downloadText, safeFilename } from '../utils/exportQuestions';

/**
 * Lista editavel das perguntas de um jogo.
 *
 * Antes este componente nao era usado por ninguem e so exibia as perguntas.
 * Como as perguntas ficam embutidas no documento do jogo, depois de salvar nao
 * havia como corrigir uma palavra-chave ruim sem apagar o jogo inteiro.
 *
 * Controlado: recebe `questions` e devolve a lista nova em `onChange`.
 */
/**
 * @param {{questions: import('../types.js').Question[],
 *   onChange: (qs: import('../types.js').Question[]) => void,
 *   exportName?: string}} props
 */
export default function QuestionManager({ questions, onChange, exportName }) {
  const [open, setOpen] = useState(false);

  const wordCounts = useMemo(() => countWords(questions), [questions]);
  const issuesById = useMemo(() => {
    const map = new Map();
    for (const q of questions) map.set(q.id, findQuestionIssues(q, wordCounts));
    return map;
  }, [questions, wordCounts]);

  const pending = [...issuesById.values()].filter((list) => list.length > 0).length;

  if (questions.length === 0) return null;

  const update = (id, field, value) => {
    const clean = field === 'word' ? sanitizeWord(value).slice(0, MAX_WORD_LEN) : value;
    onChange(questions.map((q) => (q.id === id ? { ...q, [field]: clean } : q)));
  };

  const remove = (id) => onChange(questions.filter((q) => q.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <p style={{ fontSize: '0.9rem', margin: 0, color: pending > 0 ? 'var(--danger)' : 'var(--muted)' }}>
          {questions.length} perguntas
          {pending > 0 && ` · ${pending} precisam de atencao`}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => downloadText(safeFilename(exportName, 'txt'), toTXT(questions))}
            title="Baixa no mesmo formato que o importador aceita de volta"
          >
            ⬇ TXT
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => downloadText(
              safeFilename(exportName, 'json'), toJSON(questions), 'application/json;charset=utf-8'
            )}
          >
            ⬇ JSON
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)}>
            {open ? 'Ocultar perguntas' : 'Revisar perguntas'}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ display: 'grid', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '10px' }}>
          {questions.map((q, idx) => {
            const issues = issuesById.get(q.id) || [];
            return (
              <div
                key={q.id}
                style={{
                  background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px',
                  border: `1px solid ${issues.length ? 'var(--danger)' : 'var(--panel-b)'}`,
                  position: 'relative',
                }}
              >
                <button
                  type="button"
                  onClick={() => remove(q.id)}
                  aria-label={`Excluir pergunta ${idx + 1}`}
                  style={{
                    position: 'absolute', top: '10px', right: '10px', background: 'none',
                    border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem',
                  }}
                >
                  🗑️
                </button>

                {issues.length > 0 && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginBottom: '8px', paddingRight: '30px' }}>
                    {issues.join(' · ')}
                  </div>
                )}

                <div style={{ fontWeight: '700', marginBottom: '8px', paddingRight: '30px' }}>
                  {idx + 1}. {q.q}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === q.correct;
                    return (
                      <button
                        type="button"
                        key={oIdx}
                        role="radio"
                        aria-checked={isCorrect}
                        onClick={() => update(q.id, 'correct', oIdx)}
                        style={{
                          textAlign: 'left', font: 'inherit', cursor: 'pointer',
                          padding: '6px 10px', borderRadius: '6px',
                          background: isCorrect ? 'rgba(57,255,20,0.12)' : 'transparent',
                          border: isCorrect ? '1px solid var(--t3)' : '1px solid transparent',
                          color: isCorrect ? 'var(--success)' : 'var(--muted)',
                          fontWeight: isCorrect ? '600' : 'normal',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="input-wrap" style={{ marginTop: '10px' }}>
                  <label className="input-label" htmlFor={`qm-w-${q.id}`}>
                    Palavra Escondida{' '}
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400 }}>
                      ({MIN_WORD_LEN} a {MAX_WORD_LEN} letras, sem acento)
                    </span>
                  </label>
                  <input
                    id={`qm-w-${q.id}`}
                    type="text"
                    value={q.word || ''}
                    maxLength={MAX_WORD_LEN}
                    onChange={(e) => update(q.id, 'word', e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
