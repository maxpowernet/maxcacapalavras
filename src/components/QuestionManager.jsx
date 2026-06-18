import { useState } from 'react';
import { useQuestions } from '../hooks/useQuestions';

export default function QuestionManager() {
  const { questions, removeQuestion, clearQuestions } = useQuestions();
  const [viewMode, setViewMode] = useState(false);

  if (questions.length === 0) return null;

  return (
    <div className="glass animate-fade" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Banco de Perguntas</h2>
          <p style={{ fontSize: '0.9rem' }}>{questions.length} perguntas cadastradas</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setViewMode(!viewMode)}>
            {viewMode ? 'Ocultar Detalhes' : 'Ver Perguntas'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => {
            if (window.confirm('Tem certeza que deseja apagar TODAS as perguntas?')) {
              clearQuestions();
            }
          }}>
            Apagar Tudo
          </button>
        </div>
      </div>

      {viewMode && (
        <div style={{ 
          display: 'grid', gap: '12px', 
          maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' 
        }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ 
              background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px',
              border: '1px solid var(--panel-b)', position: 'relative'
            }}>
              <button 
                onClick={() => removeQuestion(q.id)}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'none', border: 'none', color: 'var(--danger)',
                  cursor: 'pointer', fontSize: '1.2rem'
                }}
                title="Excluir"
              >
                🗑️
              </button>
              <div style={{ fontWeight: '700', marginBottom: '8px', paddingRight: '30px' }}>
                {idx + 1}. {q.q}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ color: oIdx === q.correct ? 'var(--success)' : 'inherit', fontWeight: oIdx === q.correct ? '600' : 'normal' }}>
                    {opt}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--t1)', fontWeight: '600' }}>Palavra: </span>
                {q.word}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
