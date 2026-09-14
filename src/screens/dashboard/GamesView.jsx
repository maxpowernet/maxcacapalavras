import { useState } from 'react';
import { useGames } from '../../hooks/useGames';
import { useClasses } from '../../hooks/useClasses';
import { useAppContext } from '../../context/AppContext';
import FileUploader from '../../components/FileUploader';
import QuestionTextParser from '../../components/QuestionTextParser';
import QuestionManager from '../../components/QuestionManager';
import QuestionBankPicker from '../../components/QuestionBankPicker';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useDialog } from '../../hooks/useDialog';
import { findQuestionIssues, countWords } from '../../utils/questionValidation';

export default function GamesView({ onStartGameClick }) {
  const { games, addGame, removeGame, updateGame } = useGames();
  const { publishBank } = useQuestionBanks();
  const dialog = useDialog();
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
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Publica as perguntas do jogo como banco reutilizavel por outros instrutores.
  const handlePublishBank = async () => {
    if (newGame.questions.length === 0 || isPublishing) return;
    const name = await dialog.prompt(
      'Como este banco vai aparecer para você e para os outros instrutores?',
      newGame.name || 'Meu banco',
      { title: 'Publicar banco de perguntas', label: 'Nome do banco', confirmText: 'Continuar' }
    );
    if (!name || !name.trim()) return;

    const shared = await dialog.confirm(
      'Deixar este banco visível para outros instrutores?',
      { title: 'Visibilidade', confirmText: 'Publicar para todos', cancelText: 'Só para mim' }
    );
    setIsPublishing(true);
    try {
      await publishBank({ name: name.trim(), questions: newGame.questions, isPublic: shared });
      dialog.alert(shared ? 'Banco publicado para todos os instrutores.' : 'Banco salvo só para você.');
    } catch (err) {
      console.error('Falha ao publicar o banco:', err);
      dialog.alert('Nao foi possivel publicar o banco. Verifique sua conexao e tente novamente.');
    } finally {
      setIsPublishing(false);
    }
  };
  // id do jogo em edicao (null = criando um novo)
  const [editingId, setEditingId] = useState(null);

  const startEditing = (game) => {
    setEditingId(game.id);
    setNewGame({
      name: game.name || '',
      classId: game.classId || '',
      scoreType: game.scoreType || 'total',
      targetScore: game.targetScore || 100,
      questions: game.questions || [],
    });
    setIsCreating(true);
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setNewGame({ name: '', classId: '', scoreType: 'total', targetScore: 100, questions: [] });
  };

  // Junta as perguntas importadas as que ja estavam no rascunho. Antes isto
  // SUBSTITUIA a lista, entao importar um PDF e depois colar um texto (ou
  // vice-versa) descartava a primeira importacao em silencio.
  const addQuestionsToDraft = (qs) => {
    setNewGame(prev => {
      const seen = new Set(prev.questions.map(q => q.id));
      return { ...prev, questions: [...prev.questions, ...qs.filter(q => !seen.has(q.id))] };
    });
  };

  const handleSaveGame = async () => {
    if (!newGame.name.trim() || !newGame.classId || newGame.questions.length === 0) {
      dialog.alert('Preencha o nome, selecione a turma e adicione pelo menos uma pergunta.');
      return;
    }

    // Uma pergunta sem resposta correta ou sem palavra valida trava o jogo em
    // andamento, entao ela nao pode ser gravada.
    const counts = countWords(newGame.questions);
    const badIdx = newGame.questions.findIndex(q => findQuestionIssues(q, counts).length > 0);
    if (badIdx !== -1) {
      dialog.alert(
        `A pergunta ${badIdx + 1} esta incompleta: ` +
        findQuestionIssues(newGame.questions[badIdx], counts).join(', ') +
        '. Abra "Revisar perguntas" para corrigir.'
      );
      return;
    }

    if (isSaving) return;

    // addGame e assincrono. Antes nao era aguardado nem tinha catch: se a
    // gravacao falhasse, o formulario fechava como se tivesse dado certo e a
    // importacao inteira era perdida sem aviso nenhum.
    setIsSaving(true);
    try {
      if (editingId) await updateGame(editingId, newGame);
      else await addGame(newGame);
      closeForm();
    } catch (err) {
      console.error('Falha ao salvar o jogo:', err);
      dialog.alert('Nao foi possivel salvar o jogo. Verifique sua conexao e tente novamente — as perguntas importadas continuam aqui.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async (game) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await addGame({
        name: `${game.name} (cópia)`,
        classId: game.classId,
        scoreType: game.scoreType,
        targetScore: game.targetScore,
        // Ids novos: editar a copia nao mexe no jogo original.
        questions: (game.questions || []).map((q, i) => ({ ...q, id: `${game.id}-copia-${i}` })),
      });
    } catch (err) {
      console.error('Falha ao duplicar o jogo:', err);
      dialog.alert('Nao foi possivel duplicar o jogo. Verifique sua conexao e tente novamente.');
    } finally {
      setIsSaving(false);
    }
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
          <h2>{editingId ? 'Editar Jogo / Quiz' : 'Criar Novo Jogo / Quiz'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={closeForm}>Cancelar</button>
        </div>

        <div className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="input-wrap" style={{ flex: 2 }}>
              <label className="input-label" htmlFor="jogo-nome">Nome do Jogo</label>
              <input id="jogo-nome" type="text" value={newGame.name} onChange={e => setNewGame({...newGame, name: e.target.value})} placeholder="Ex: Revisão Prova Bimestral" />
            </div>
            
            <div className="input-wrap" style={{ flex: 1 }}>
              <label className="input-label" htmlFor="jogo-turma">Turma Vinculada</label>
              <select id="jogo-turma" value={newGame.classId} onChange={e => setNewGame({...newGame, classId: e.target.value})} style={{ padding: '13px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'inherit', border: '1px solid var(--panel-b)' }}>
                <option value="">Selecione...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label className="input-label" htmlFor="jogo-regra">Regra de Pontos</label>
              <select id="jogo-regra" value={newGame.scoreType} onChange={e => setNewGame({...newGame, scoreType: e.target.value})} style={{ padding: '13px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'inherit', border: '1px solid var(--panel-b)' }}>
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
              <button className={`btn btn-sm ${inputMode === 'bank' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMode('bank')}>Banco Compartilhado</button>
            </div>
          </div>

          {inputMode === 'upload' && <FileUploader onQuestionsLoaded={addQuestionsToDraft} />}
          {inputMode === 'text' && <QuestionTextParser onQuestionsParsed={addQuestionsToDraft} />}
          {inputMode === 'bank' && <QuestionBankPicker onImport={addQuestionsToDraft} />}
          
          {newGame.questions.length > 0 && (
             <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <button
                 type="button"
                 className="btn btn-secondary btn-sm"
                 onClick={handlePublishBank}
                 disabled={isPublishing}
                 style={{ alignSelf: 'flex-start' }}
               >
                 {isPublishing ? 'Publicando...' : '📤 Publicar como banco de perguntas'}
               </button>
               <QuestionManager
                 exportName={newGame.name}
                 questions={newGame.questions}
                 onChange={(qs) => setNewGame(prev => ({ ...prev, questions: qs }))}
               />
             </div>
          )}
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSaveGame} disabled={isSaving}>
          {isSaving ? 'Salvando...' : (editingId ? 'Salvar Alteracoes' : 'Salvar Jogo')}
        </button>
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
                  onClick={async () => {
                    const ok = await dialog.confirm('Excluir este jogo?', { danger: true, confirmText: 'Excluir' });
                    if (!ok) return;
                    try {
                      await removeGame(g.id);
                    } catch (err) {
      console.error('Falha ao excluir o jogo:', err);
      dialog.alert('Nao foi possivel excluir o jogo. Verifique sua conexao e tente novamente.');
                    }
                  }}
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => startEditing(g)}>
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleDuplicate(g)}
                    disabled={isSaving}
                  >
                    ⧉ Duplicar
                  </button>
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
