import { useMemo, useRef, useState } from 'react';
import { parseFile, isSupportedFile } from '../utils/parseFile';
import { sanitizeWord, MAX_WORD_LEN, MIN_WORD_LEN } from '../utils/wordGrid';
import { findQuestionIssues, countWords } from '../utils/questionValidation';
import GridPreview from './GridPreview';

const MAX_FILE_MB = 25;

export default function FileUploader({ onQuestionsLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedCards, setParsedCards] = useState([]);
  const [progress, setProgress] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const fileInputRef = useRef(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef(null);
  const cardRefs = useRef({});

  const cancelParse = () => abortRef.current?.abort();

  const handleFile = async (file) => {
    // Evita que dois arquivos soltos em sequencia disputem quem resolve por ultimo.
    if (inFlightRef.current) return;

    setError(null);
    setParsedCards([]);

    if (!isSupportedFile(file)) {
      setError('Apenas arquivos PDF ou TXT sao suportados.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande (limite de ${MAX_FILE_MB} MB).`);
      return;
    }

    inFlightRef.current = true;
    abortRef.current = new AbortController();
    setProgress(null);
    setIsLoading(true);
    try {
      const questions = await parseFile(file, {
        signal: abortRef.current.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (questions.length === 0) {
        throw new Error(
          'Nenhuma pergunta encontrada. O arquivo precisa ter enunciados numerados ' +
          '("Questao 1", "1." ...) seguidos das alternativas A) B) C) D).'
        );
      }

      setParsedCards(questions.map((q) => ({
        id: q.id,
        q: q.q,
        options: q.options,
        correctIndex: q.correct >= 0 ? q.correct : null,
        word: q.word || '',
      })));
    } catch (err) {
      // Cancelamento e uma escolha do instrutor, nao um erro.
      if (!/cancelada/i.test(err?.message || '')) {
        setError(err.message || 'Erro ao ler arquivo.');
      }
    } finally {
      inFlightRef.current = false;
      abortRef.current = null;
      setProgress(null);
      setIsLoading(false);
    }
  };

  // Sem isso, reescolher o MESMO arquivo depois de um erro nao dispara evento
  // nenhum e parece que a tela travou.
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
  };

  const handleUpdateCard = (id, field, value) => {
    // A palavra e normalizada na digitacao: a Forca so tem teclado A-Z, entao
    // um "SEGURANCA" com cedilha travaria a rodada para sempre.
    const clean = field === 'word' ? sanitizeWord(value).slice(0, MAX_WORD_LEN) : value;
    setParsedCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: clean } : c)));
  };

  const handleRemoveCard = (id) => {
    setParsedCards((prev) => prev.filter((c) => c.id !== id));
  };

  const wordCounts = useMemo(() => countWords(parsedCards), [parsedCards]);

  const issuesById = useMemo(() => {
    const map = new Map();
    for (const c of parsedCards) {
      map.set(c.id, findQuestionIssues({ ...c, correct: c.correctIndex }, wordCounts));
    }
    return map;
  }, [parsedCards, wordCounts]);

  const pendingCount = useMemo(
    () => [...issuesById.values()].filter((list) => list.length > 0).length,
    [issuesById]
  );

  const scrollToFirstIssue = () => {
    const first = parsedCards.find((c) => (issuesById.get(c.id) || []).length > 0);
    if (first && cardRefs.current[first.id]) {
      cardRefs.current[first.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFinalize = () => {
    if (pendingCount > 0) {
      scrollToFirstIssue();
      return;
    }
    onQuestionsLoaded(parsedCards.map((c) => ({
      id: c.id,
      q: c.q.trim(),
      options: c.options,
      correct: c.correctIndex,
      word: sanitizeWord(c.word),
    })));
    setParsedCards([]);
  };

  // ── Area de upload ─────────────────────────────────────────────────────────
  if (parsedCards.length === 0) {
    const openPicker = () => { if (!isLoading) fileInputRef.current?.click(); };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Importar perguntas de um arquivo PDF ou TXT"
          aria-busy={isLoading}
          onDragOver={(e) => { e.preventDefault(); if (!isLoading) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (isLoading) return;
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
          }}
          style={{
            border: `2px dashed ${isDragging ? 'var(--t1)' : 'var(--panel-b)'}`,
            background: isDragging ? 'rgba(0,242,255,0.05)' : 'rgba(0,0,0,0.2)',
            padding: '40px 20px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            cursor: isLoading ? 'progress' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            pointerEvents: isLoading ? 'none' : 'auto',
            transition: 'all 0.3s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".txt,.pdf,application/pdf,text/plain"
            onChange={handleInputChange}
          />
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: isDragging ? 'var(--t1)' : '#fff' }}>
            Importar Perguntas
          </h3>
          <p style={{ fontSize: '0.9rem' }}>
            Arraste e solte um arquivo PDF ou TXT, ou clique para selecionar.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '6px' }}>
            Enunciados numerados ("Questao 1", "Pergunta 1", "1.") com alternativas A) a E).
            A resposta correta e detectada por destaque no texto ou por um gabarito no fim.
          </p>

          {isLoading && (
            <div style={{ marginTop: '15px', color: 'var(--t3)' }} role="status">
              {progress
                ? 'Lendo o PDF — página ' + progress.done + ' de ' + progress.total
                : 'Lendo arquivo...'}
              {progress && (
                <div
                  role="progressbar"
                  aria-valuenow={progress.done}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  style={{
                    marginTop: '8px', height: '6px', borderRadius: '3px',
                    background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: (progress.done / progress.total) * 100 + '%',
                    height: '100%', background: 'var(--t3)', transition: 'width 0.2s',
                  }} />
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={cancelParse}>
            Cancelar leitura
          </button>
        )}

        {error && (
          <div role="alert" style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Tela de revisao ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <h4 style={{ margin: 0 }}>Revisao — {parsedCards.length} perguntas encontradas</h4>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => { setParsedCards([]); setError(null); }}
        >
          Descartar e Reenviar
        </button>
      </div>

      {pendingCount > 0 ? (
        <div
          role="alert"
          style={{
            padding: '12px 16px', borderRadius: '8px',
            background: 'rgba(255,51,85,0.1)', border: '1px solid var(--danger)',
            color: 'var(--danger)', fontSize: '0.9rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
          }}
        >
          <span>
            {pendingCount === 1
              ? '1 pergunta precisa de atencao antes de continuar.'
              : `${pendingCount} perguntas precisam de atencao antes de continuar.`}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={scrollToFirstIssue}>
            Ir para a primeira
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 16px', borderRadius: '8px',
            background: 'rgba(57,255,20,0.1)', border: '1px solid var(--t3)',
            color: 'var(--t3)', fontSize: '0.9rem',
          }}
        >
          Tudo certo — {parsedCards.length} perguntas prontas para o jogo.
        </div>
      )}

      <p style={{ fontSize: '0.85rem', color: 'var(--t4)', margin: 0 }}>
        Confira a resposta correta (clique para alterar) e a <strong>palavra-chave</strong>
        {' '}gerada automaticamente para o caca-palavras. Edite se necessario.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '520px', overflowY: 'auto', paddingRight: '8px' }}>
        {parsedCards.map((card, idx) => {
          const issues = issuesById.get(card.id) || [];
          const hasIssue = issues.length > 0;

          return (
            <div
              key={card.id}
              ref={(el) => { cardRefs.current[card.id] = el; }}
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: `1px solid ${hasIssue ? 'var(--danger)' : 'var(--panel-b)'}`,
                borderRadius: '10px', padding: '16px', position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => handleRemoveCard(card.id)}
                aria-label={`Remover pergunta ${idx + 1}`}
                style={{
                  position: 'absolute', top: '10px', right: '10px', background: 'none',
                  border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem',
                }}
              >
                🗑️
              </button>

              {hasIssue && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '10px', paddingRight: '28px' }}>
                  {issues.join(' · ')}
                </div>
              )}

              <div className="input-wrap" style={{ marginBottom: '10px', paddingRight: '28px' }}>
                <label className="input-label" htmlFor={`q-${card.id}`}>Pergunta {idx + 1}</label>
                <input
                  id={`q-${card.id}`}
                  type="text"
                  value={card.q}
                  onChange={(e) => handleUpdateCard(card.id, 'q', e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
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
                        padding: '9px 14px', borderRadius: '7px', cursor: 'pointer',
                        fontSize: '0.875rem', textAlign: 'left', font: 'inherit',
                        background: isSelected ? 'rgba(57,255,20,0.12)' : 'rgba(255,255,255,0.05)',
                        border: isSelected ? '1px solid var(--t3)' : '1px solid transparent',
                        color: isSelected ? 'var(--t3)' : 'inherit',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                    >
                      {isSelected && <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="input-wrap">
                <label className="input-label" htmlFor={`w-${card.id}`}>
                  Palavra Escondida no Grid{' '}
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>
                    ({MIN_WORD_LEN} a {MAX_WORD_LEN} letras, sem acento)
                  </span>
                </label>
                <input
                  id={`w-${card.id}`}
                  type="text"
                  placeholder="Ex: SEGURANCA"
                  value={card.word}
                  maxLength={MAX_WORD_LEN}
                  onChange={(e) => handleUpdateCard(card.id, 'word', e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '10px' }}
                onClick={() => setPreviewId(previewId === card.id ? null : card.id)}
                aria-expanded={previewId === card.id}
              >
                {previewId === card.id ? 'Ocultar prévia da grade' : 'Ver prévia da grade'}
              </button>

              {previewId === card.id && (
                <div style={{ marginTop: '10px' }}>
                  <GridPreview word={card.word} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleFinalize}
        disabled={pendingCount > 0}
        title={pendingCount > 0 ? 'Resolva as pendencias para continuar' : undefined}
      >
        {pendingCount > 0
          ? `Resolva ${pendingCount} pendencia(s) para continuar`
          : `Confirmar e Adicionar ao Jogo (${parsedCards.length} perguntas)`}
      </button>
    </div>
  );
}
