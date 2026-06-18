import { useRef, useState } from 'react';
import { parseFile } from '../utils/parseFile';

export default function FileUploader({ onQuestionsLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    setError(null);
    setIsLoading(true);
    try {
      if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        throw new Error('Apenas arquivos PDF ou TXT são suportados.');
      }
      
      const questions = await parseFile(file);
      if (questions.length === 0) {
        throw new Error('Nenhuma pergunta encontrada no formato esperado.');
      }
      
      onQuestionsLoaded(questions);
    } catch (err) {
      setError(err.message || 'Erro ao ler arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--t1)' : 'var(--panel-b)'}`,
          background: isDragging ? 'rgba(0,242,255,0.05)' : 'rgba(0,0,0,0.2)',
          padding: '40px 20px',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".txt,.pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
          }}
        />
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: isDragging ? 'var(--t1)' : '#fff' }}>
          Importar Perguntas
        </h3>
        <p style={{ fontSize: '0.9rem' }}>
          Arraste e solte um arquivo PDF ou TXT, ou clique para selecionar.
        </p>
        
        {isLoading && <div style={{ marginTop: '15px', color: 'var(--t3)' }}>Processando...</div>}
      </div>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
    </div>
  );
}
