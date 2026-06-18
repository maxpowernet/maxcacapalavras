import { useState } from 'react';
import { useGames } from '../../hooks/useGames';
import { useClasses } from '../../hooks/useClasses';
import { useAppContext } from '../../context/AppContext';
import FileUploader from '../../components/FileUploader';
import QuestionTextParser from '../../components/QuestionTextParser';

export default function GamesView({ onStartGameClick }) {
  const { games, addGame, removeGame } = useGames();
  const { classes } = useClasses();
  const { setQuestions } = useAppContext(); // Usado para injetar as perguntas no estado do jogo atual
  
  const [isCreating, setIsCreating] = useState(false);
  const [newGame, setNewGame] = useState({
    name: '',
    classId: '',
    scoreType: 'total', // 'total' ou 'per_question'
    targetScore: 100,
    questions: []
  });

  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'text'

  const handleSaveGame = () => {
    if (!newGame.name.trim() || !newGame.classId || newGame.questions.length === 0) {
      alert('Preencha o nome, selecione a turma e adicione pelo menos uma pergunta.');
      return;
    }
    
    addGame(newGame);
    setIsCreating(false);
    setNewGame({ name: '', classId: '', scoreType: 'total', targetScore: 100, questions: [] });
  };

  const handlePlayClick = (game) => {
    // Carrega as perguntas desse jogo no contexto global para o GameScreen usar
    setQuestions(game.questions);
    // Armazena temporariamente no sessionStorage ou state qual jogo está ativo se quisermos salvar no histórico (faremos no hook depois)
    sessionStorage.setItem('mcp_active_game_id', game.id);
    sessionStorage.setItem('mcp_active_class_id', game.classId);
    
    onStartGameClick();
  };

  if (isCreating) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Criar Novo Jogo / Quiz</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsCreating(false)}>Cancelar</button>
        </div>

        <div className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="input-wrap" style={{ flex: 2 }}>
              <label className="input-label">Nome do Jogo</label>
              <input type="text" value={newGame.name} onChange={e => setNewGame({...newGame, name: e.target.value})} placeholder="Ex: Revisão Prova Bimestral" />
            </div>
            
            <div className="input-wrap" style={{ flex: 1 }}>
              <label className="input-label">Turma Vinculada</label>
              <select value={newGame.classId} onChange={e => setNewGame({...newGame, classId: e.target.value})} style={{ padding: '13px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'inherit', border: '1px solid var(--panel-b)' }}>
                <option value="">Selecione...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label className="input-label">Regra de Pontos</label>
              <select value={newGame.scoreType} onChange={e => setNewGame({...newGame, scoreType: e.target.value})} style={{ padding: '13px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'inherit', border: '1px solid var(--panel-b)' }}>
                <option value="total">Dividir Meta Total pelas Perguntas</option>
                <option value="per_question">Pontuação Fixa por Pergunta</option>
              </select>
            </div>
            
            <div className="input-wrap" style={{ flex: 1 }}>
              <label className="input-label">{newGame.scoreType === 'total' ? 'Meta Total (ex: 100)' : 'Pontos por Pergunta (ex: 10)'}</label>
              <input type="number" min="1" value={newGame.targetScore} onChange={e => setNewGame({...newGame, targetScore: parseInt(e.target.value) || 0})} />
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Perguntas ({newGame.questions.length})</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={`btn btn-sm ${inputMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMode('upload')}>Upload PDF/TXT</button>
              <button className={`btn btn-sm ${inputMode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMode('text')}>Colar Texto</button>
            </div>
          </div>

          {inputMode === 'upload' ? (
             <FileUploader onQuestionsLoaded={(qs) => setNewGame({...newGame, questions: qs})} />
          ) : (
             <QuestionTextParser onQuestionsParsed={(qs) => setNewGame({...newGame, questions: qs})} />
          )}
          
          {newGame.questions.length > 0 && (
             <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(57,255,20,0.1)', border: '1px solid var(--t3)', borderRadius: '8px', color: 'var(--t3)' }}>
               {newGame.questions.length} perguntas adicionadas e validadas!
             </div>
          )}
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSaveGame}>Salvar Jogo</button>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-title">Meus Jogos</h1>
          <p>Crie e gerencie os questionários (Caça-Palavras) para suas turmas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>+ Criar Jogo</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {games.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            Nenhum jogo criado ainda. Clique em "+ Criar Jogo" para começar.
          </div>
        ) : (
          games.map(g => {
            const cls = classes.find(c => c.id === g.classId);
            return (
              <div key={g.id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                <button 
                  onClick={() => { if(window.confirm('Excluir este jogo?')) removeGame(g.id) }}
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,51,85,0.1)', border: '1px solid rgba(255,51,85,0.2)', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,51,85,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,51,85,0.1)'}
                >🗑️</button>

                {/* Faixa colorida decorativa */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: `linear-gradient(to bottom, var(--t1), var(--t3))`, borderRadius: '16px 0 0 16px' }} />

                <div style={{ paddingLeft: '8px' }}>
                  <h3 style={{ marginBottom: '6px', paddingRight: '36px', fontSize: '1.05rem' }}>{g.name}</h3>
                  <div className="badge badge-student">{cls ? cls.name : 'Turma Removida'}</div>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingLeft: '8px' }}>
                  <div><strong style={{ color: 'var(--text)' }}>Perguntas:</strong> {g.questions?.length || 0}</div>
                  <div><strong style={{ color: 'var(--text)' }}>Meta:</strong> {g.scoreType === 'total' ? `${g.targetScore} pts` : `${g.targetScore} / perg`}</div>
                </div>

                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 'auto', borderRadius: '10px' }}
                  onClick={() => handlePlayClick(g)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  ▶ Jogar Agora
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
