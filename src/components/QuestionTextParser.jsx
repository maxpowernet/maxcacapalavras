import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { assignKeywords } from '../utils/keyword';
import { sanitizeWord, MAX_WORD_LEN, MIN_WORD_LEN } from '../utils/wordGrid';
import { useDialog } from '../hooks/useDialog';

export default function QuestionTextParser({ onQuestionsParsed }) {
  const dialog = useDialog();
  const [rawText, setRawText] = useState('');
  const [parsedCards, setParsedCards] = useState([]);

  // Parse bruto separando blocos por linha em branco
  const handleProcessText = () => {
    const blocks = rawText.split(/\n\s*\n/).filter(b => b.trim().length > 0);

    const draft = blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let q = lines[0] || '';
      const options = lines.slice(1);

      // Limpeza se tiver "Pergunta:" ou "1." na frente
      q = q.replace(/^(pergunta|q|question|\d+)\s*[:.-]?\s*/i, '');

      return { id: uuidv4(), q, options, correct: -1, word: '' };
    });

    // Mesma geracao automatica de palavra-chave do importador de PDF — antes o
    // instrutor tinha que digitar todas as palavras a mao.
    setParsedCards(assignKeywords(draft).map(c => ({
      id: c.id, q: c.q, options: c.options, correctIndex: null, word: c.word,
    })));
  };

  const handleUpdateCard = (id, field, value) => {
    const clean = field === 'word' ? sanitizeWord(value).slice(0, MAX_WORD_LEN) : value;
    setParsedCards(prev => prev.map(c => (c.id === id ? { ...c, [field]: clean } : c)));
  };

  const handleRemoveCard = (id) => {
    setParsedCards(prev => prev.filter(c => c.id !== id));
  };

  const handleFinalize = () => {
    // Aponta QUAL pergunta esta pendente — antes o alerta era generico.
    const badIdx = parsedCards.findIndex(c => (
      c.correctIndex === null ||
      c.options.length < 2 ||
      sanitizeWord(c.word).length < MIN_WORD_LEN
    ));
    if (badIdx !== -1) {
      dialog.alert(
        `A pergunta ${badIdx + 1} esta incompleta.\n\n` +
        `Cada pergunta precisa de pelo menos 2 alternativas, a resposta correta marcada ` +
        `e uma palavra-chave de ${MIN_WORD_LEN} a ${MAX_WORD_LEN} letras.`
      );
      return;
    }

    onQuestionsParsed(parsedCards.map(c => ({
      id: c.id,
      q: c.q.trim(),
      options: c.options,
      correct: c.correctIndex,
      word: sanitizeWord(c.word),
    })));
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {parsedCards.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            Cole o texto bruto das suas perguntas abaixo. Separe cada pergunta e suas alternativas com uma linha em branco.
          </p>
          <textarea 
            placeholder={"Exemplo:\n\nQual é a capital do Brasil?\nBuenos Aires\nRio de Janeiro\nBrasília\nSão Paulo\n\nQual a cor do céu?\nAzul\nVermelho\nVerde"} 
            value={rawText} 
            onChange={e => setRawText(e.target.value)}
            style={{ minHeight: '200px' }}
          />
          <button className="btn btn-primary" onClick={handleProcessText} disabled={!rawText.trim()}>
            Processar Texto
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Revisão ({parsedCards.length} perguntas)</h4>
            <button className="btn btn-secondary btn-sm" onClick={() => setParsedCards([])}>Descartar e Recomeçar</button>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--t4)' }}>
            ⚠️ Clique na alternativa correta de cada pergunta para marcá-la, e digite a palavra que ficará escondida no caça-palavras.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
            {parsedCards.map((card, idx) => (
              <div key={card.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-b)', borderRadius: '8px', padding: '15px', position: 'relative' }}>
                
                <button 
                  onClick={() => handleRemoveCard(card.id)}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                >🗑️</button>

                <div className="input-wrap" style={{ marginBottom: '10px', paddingRight: '25px' }}>
                  <label className="input-label" htmlFor={`qtp-q-${card.id}`}>Pergunta {idx + 1}</label>
                  <input id={`qtp-q-${card.id}`} type="text" value={card.q} onChange={e => handleUpdateCard(card.id, 'q', e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                  <span className="input-label">Alternativas (clique na correta)</span>
                  {card.options.map((opt, oIdx) => {
                    const isSelected = card.correctIndex === oIdx;
                    return (
                      <button
                        type="button"
                        key={oIdx}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleUpdateCard(card.id, 'correctIndex', oIdx)}
                        style={{
                          textAlign: 'left', font: 'inherit',
                          padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem',
                          background: isSelected ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)',
                          border: isSelected ? '1px solid var(--t3)' : '1px solid transparent',
                          color: isSelected ? 'var(--t3)' : 'inherit',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>

                <div className="input-wrap">
                  <label className="input-label" htmlFor={`qtp-w-${card.id}`}>Palavra Escondida no Grid</label>
                  <input 
                    id={`qtp-w-${card.id}`}
                    type="text" 
                    placeholder="Ex: BRASILIA" 
                    value={card.word} 
                    onChange={e => handleUpdateCard(card.id, 'word', e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleFinalize}>
            ✅ Concluir e Adicionar ao Jogo
          </button>
        </div>
      )}
    </div>
  );
}
