import { useRef, useState } from 'react';
import { parseFile } from '../utils/parseFile';

export default function FileUploader({ onQuestionsLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedCards, setParsedCards] = useState([]);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    setError(null);
    setIsLoading(true);
    setParsedCards([]);
    try {
      if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        throw new Error('Apenas arquivos PDF ou TXT são suportados.');
      }

      const questions = await parseFile(file);
      if (questions.length === 0) {
        throw new Error(
          'Nenhuma pergunta encontrada. Verifique o formato do arquivo.'
        );
      }

      // Mapeia para o formato de revisão (igual ao QuestionTextParser)
      const cards = questions.map((q) => ({
        id: q.id,
        q: q.q,
        options: q.options,
        correctIndex: q.correct >= 0 ? q.correct : null,
        word: q.word || '',
      }));

      setParsedCards(cards);
    } catch (err) {
      setError(err.message || 'Erro ao ler arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCard = (id, field, value) => {
    setParsedCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCard = (id) => {
    setParsedCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleFinalize = () => {
    const invalid = parsedCards.find(
      (c) => c.correctIndex === null || !c.word.trim() || c.options.length < 2
    );
    if (invalid) {
      alert(
        'Garanta que todas as perguntas tenham pelo menos 2 alternativas, ' +
        'uma resposta correta selecionada e uma palavra-chave preenchida.'
      );
      return;
    }

    const finalQuestions = parsedCards.map((c) => ({
      id: c.id,
      q: c.q,
      options: c.options,
      correct: c.correctIndex,
      word: c.word.toUpperCase().replace(/\s/g, ''),
    }));

    onQuestionsLoaded(finalQuestions);
    setParsedCards([]);
  };

  // ── Área de upload ──────────────────────────────────────────────────────────
  if (parsedCards.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--t1)' : 'var(--panel-b)'}`,
            background: isDragging ? 'rgba(0,242,255,0.05)' : 'rgba(0,0,0,0.2)',
            padding: '40px 20px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".txt,.pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
          <h3
            style={{
              fontSize: '1.2rem',
              marginBottom: '4px',
              color: isDragging ? 'var(--t1)' : '#fff',
            }}
          >
            Importar Perguntas
          </h3>
          <p style={{ fontSize: '0.9rem' }}>
            Arraste e solte um arquivo PDF ou TXT, ou clique para selecionar.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '6px' }}>
            PDFs no formato "Questão N" são detectados automaticamente.
          </p>

          {isLoading && (
            <div style={{ marginTop: '15px', color: 'var(--t3)' }}>
              ⏳ Processando PDF...
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              color: 'var(--danger)',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Tela de revisão (após parse bem-sucedido) ───────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h4 style={{ margin: 0 }}>
          ✅ Revisão — {parsedCards.length} perguntas encontradas
        </h4>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setParsedCards([]); setError(null); }}
        >
          Descartar e Reenviar
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--t4)', margin: 0 }}>
        ⚠️ Verifique a resposta correta (clique para alterar) e a{' '}
        <strong>palavra-chave</strong> gerada automaticamente para o caça-palavras.
        Edite se necessário antes de confirmar.
      </p>

      {/* Lista de cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          maxHeight: '520px',
          overflowY: 'auto',
          paddingRight: '8px',
        }}
      >
        {parsedCards.map((card, idx) => (
          <div
            key={card.id}
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--panel-b)',
              borderRadius: '10px',
              padding: '16px',
              position: 'relative',
            }}
          >
            {/* Botão excluir */}
            <button
              onClick={() => handleRemoveCard(card.id)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              title="Remover pergunta"
            >
              🗑️
            </button>

            {/* Pergunta */}
            <div className="input-wrap" style={{ marginBottom: '10px', paddingRight: '28px' }}>
              <label className="input-label">Pergunta {idx + 1}</label>
              <input
                type="text"
                value={card.q}
                onChange={(e) => handleUpdateCard(card.id, 'q', e.target.value)}
              />
            </div>

            {/* Alternativas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <label className="input-label">Alternativas (clique na correta)</label>
              {card.options.map((opt, oIdx) => {
                const isSelected = card.correctIndex === oIdx;
                return (
                  <div
                    key={oIdx}
                    onClick={() => handleUpdateCard(card.id, 'correctIndex', oIdx)}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      background: isSelected
                        ? 'rgba(57,255,20,0.12)'
                        : 'rgba(255,255,255,0.05)',
                      border: isSelected
                        ? '1px solid var(--t3)'
                        : '1px solid transparent',
                      color: isSelected ? 'var(--t3)' : 'inherit',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {isSelected && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                    )}
                    {opt}
                  </div>
                );
              })}
            </div>

            {/* Palavra-chave */}
            <div className="input-wrap">
              <label className="input-label">
                Palavra Escondida no Grid{' '}
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}
                >
                  (gerada automaticamente — edite se quiser)
                </span>
              </label>
              <input
                type="text"
                placeholder="Ex: SEGURANCA"
                value={card.word}
                onChange={(e) =>
                  handleUpdateCard(card.id, 'word', e.target.value)
                }
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Botão confirmar */}
      <button className="btn btn-primary" onClick={handleFinalize}>
        ✅ Confirmar e Adicionar ao Jogo ({parsedCards.length} perguntas)
      </button>
    </div>
  );
}
