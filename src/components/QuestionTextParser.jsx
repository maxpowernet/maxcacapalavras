import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function QuestionTextParser({ onQuestionsParsed }) {
  const [rawText, setRawText] = useState('');
  const [parsedCards, setParsedCards] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse bruto separando blocos por linha em branco
  const handleProcessText = () => {
    setIsProcessing(true);
    
    // Tenta quebrar por blocos (linhas em branco)
    const blocks = rawText.split(/\n\s*\n/).filter(b => b.trim().length > 0);
    
    const newCards = blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let q = lines[0] || '';
      let options = lines.slice(1);
      
      // Limpeza se tiver "Pergunta:" ou "1." na frente
      q = q.replace(/^(pergunta|q|question|\d+)\s*[:.-]?\s*/i, '');
      
      return {
        id: uuidv4(),
        q: q,
        options: options,
        correctIndex: null,
        word: ''
      };
    });

    setParsedCards(newCards);
    setIsProcessing(false);
  };

  const handleUpdateCard = (id, field, value) => {
    setParsedCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleRemoveCard = (id) => {
    setParsedCards(prev => prev.filter(c => c.id !== id));
  };

  const handleFinalize = () => {
    // Validar se todos têm correctIndex e word
    const invalid = parsedCards.find(c => c.correctIndex === null || !c.word.trim() || c.options.length < 2);
    if (invalid) {
      alert("Por favor, garanta que todas as perguntas tenham pelo menos 2 alternativas, uma resposta correta selecionada e uma palavra-chave preenchida.");
      return;
    }
    
    // Converte para o formato final
    const finalQuestions = parsedCards.map(c => ({
      id: c.id,
      q: c.q,
      options: c.options,
      correct: c.correctIndex,
      word: c.word.toUpperCase().replace(/\s/g, '')
    }));
    
    onQuestionsParsed(finalQuestions);
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
          <button className="btn btn-primary" onClick={handleProcessText} disabled={!rawText.trim() || isProcessing}>
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
                  <label className="input-label">Pergunta {idx + 1}</label>
                  <input type="text" value={card.q} onChange={e => handleUpdateCard(card.id, 'q', e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                  <label className="input-label">Alternativas (clique na correta)</label>
                  {card.options.map((opt, oIdx) => {
                    const isSelected = card.correctIndex === oIdx;
                    return (
                      <div 
                        key={oIdx}
                        onClick={() => handleUpdateCard(card.id, 'correctIndex', oIdx)}
                        style={{
                          padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem',
                          background: isSelected ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)',
                          border: isSelected ? '1px solid var(--t3)' : '1px solid transparent',
                          color: isSelected ? 'var(--t3)' : 'inherit',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt}
                      </div>
                    )
                  })}
                </div>

                <div className="input-wrap">
                  <label className="input-label">Palavra Escondida no Grid</label>
                  <input 
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
