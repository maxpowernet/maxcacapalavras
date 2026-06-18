import { useGame } from '../../hooks/useGame';
import { useAppContext } from '../../context/AppContext';
import { GameLayout, HEX_COLORS } from './GameLayout';
import HangmanDisplay from '../../components/HangmanDisplay';
import QuizOverlay from '../../components/QuizOverlay';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ForcaScreen() {
  const { gameState, answerForcaQuiz, guessForcaLetter, nextTurn } = useGame();
  const { questions } = useAppContext();

  const currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);
  const phase = gameState.phase; // 'quiz' | 'forca' | 'turn_transition'
  const guessed = gameState.forcaGuessed || [];
  const wrong = gameState.forcaWrong || [];
  const activeColor = HEX_COLORS[gameState.currentTeamIndex % 4];

  if (!currentQuestion) return null;

  const word = currentQuestion.word.toUpperCase();
  const revealed = word.split('').map(l => (guessed.includes(l) ? l : '_'));

  const rightPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      {phase === 'forca' && (
        <>
          <HangmanDisplay wrongCount={wrong.length} color={activeColor} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Erros</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: wrong.length >= 4 ? '#FF3355' : activeColor }}>
              {wrong.length} / 6
            </div>
          </div>
          {wrong.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {wrong.map(l => (
                <span key={l} style={{ background: 'rgba(255,51,85,0.2)', border: '1px solid #FF3355', borderRadius: '6px', padding: '4px 8px', color: '#FF3355', fontWeight: '700' }}>{l}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <GameLayout
      currentTeamIndex={gameState.currentTeamIndex}
      teams={gameState.teams}
      rightPanel={rightPanel}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
        {phase === 'quiz' && (
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <QuizOverlay question={currentQuestion} activeTeamId={gameState.currentTeamIndex} onAnswer={answerForcaQuiz} />
          </div>
        )}

        {phase === 'turn_transition' && (
          <div className="animate-fade glass" style={{
            padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'
          }}>
            <div style={{ fontSize: '3rem' }}>{wrong.length >= 6 ? '💀' : '🎉'}</div>
            <h2>{wrong.length >= 6 ? 'Boneco completo! Sem pontos.' : 'Palavra encontrada!'}</h2>
            <div style={{ fontSize: '1.8rem', letterSpacing: '6px', color: activeColor, fontWeight: '800' }}>{word}</div>
            <button className="btn btn-primary" onClick={nextTurn}>Próximo Turno →</button>
          </div>
        )}

        {phase === 'forca' && (
          <>
            {/* Palavra revelada */}
            <div className="glass" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '12px', letterSpacing: '2px' }}>🔤 FORCA</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {revealed.map((l, i) => (
                  <div key={i} style={{
                    width: '40px', textAlign: 'center',
                    borderBottom: `3px solid ${l !== '_' ? activeColor : 'rgba(255,255,255,0.3)'}`,
                    paddingBottom: '4px',
                    fontSize: '1.4rem', fontWeight: '800',
                    color: l !== '_' ? activeColor : 'transparent',
                    transition: 'color 0.3s',
                  }}>
                    {l !== '_' ? l : ' '}
                  </div>
                ))}
              </div>
            </div>

            {/* Teclado Virtual */}
            <div className="glass" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {ALPHABET.map(letter => {
                  const isGuessed = guessed.includes(letter);
                  const isWrong = wrong.includes(letter);
                  return (
                    <button
                      key={letter}
                      onClick={() => guessForcaLetter(letter)}
                      disabled={isGuessed || isWrong}
                      style={{
                        width: '38px', height: '38px',
                        background: isGuessed ? `${activeColor}33` : isWrong ? 'rgba(255,51,85,0.2)' : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${isGuessed ? activeColor : isWrong ? '#FF3355' : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: '8px',
                        color: isGuessed ? activeColor : isWrong ? '#FF3355' : 'var(--text)',
                        fontFamily: 'var(--font)',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: (isGuessed || isWrong) ? 'not-allowed' : 'pointer',
                        opacity: (isGuessed || isWrong) ? 0.5 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </GameLayout>
  );
}
