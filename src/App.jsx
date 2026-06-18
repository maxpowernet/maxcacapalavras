import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import { useGame } from './hooks/useGame';

import AuthScreen from './screens/AuthScreen';
import InstructorDashboard from './screens/InstructorDashboard';
import TeamSetupScreen from './screens/TeamSetupScreen';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';

export default function App() {
  const { user, authLoading, setQuestions, isLightMode, toggleTheme } = useAppContext();
  const { gameState, startGame } = useGame();
  
  const [showTeamSetup, setShowTeamSetup] = useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '';
  const AVATAR_COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33'];
  const avatarColor = initials ? AVATAR_COLORS[initials.charCodeAt(0) % 4] : '#00F2FF';

  // Barra superior flutuante: nome do usuário + alternador de tema
  // (na Dashboard essas informações já aparecem no card flutuante da sidebar)
  const renderTopBar = (showProfile = true) => (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
        background: 'var(--panel)',
        border: '1px solid var(--panel-b)',
        borderRadius: '999px',
        padding: '6px 8px 6px 12px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {user && showProfile && (
        <>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: `${avatarColor}30`, border: `1.5px solid ${avatarColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '0.7rem', color: avatarColor,
          }}>
            {initials}
          </div>
          <span style={{
            fontSize: '0.82rem', fontWeight: '700',
            color: 'var(--text)', whiteSpace: 'nowrap',
            maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user.name}
          </span>
          <div style={{ width: '1px', height: '18px', background: 'var(--panel-b)' }} />
        </>
      )}
      <button
        onClick={toggleTheme}
        title={isLightMode ? 'Modo Escuro' : 'Modo Claro'}
        style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'transparent', border: 'none',
          color: 'var(--text)', fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        {isLightMode ? '🌙' : '☀️'}
      </button>
    </div>
  );

  // Router simples baseado em estado

  // 1. Carregando Autenticação
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', width: '100%', height: '100vh',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text)',
        fontFamily: 'var(--font)', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '4px solid var(--panel-b)',
          borderTop: '4px solid var(--t1)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: '600' }}>Carregando...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Não logado
  if (!user) {
    return (
      <>
        {renderTopBar()}
        <AuthScreen />
      </>
    );
  }

  // 2. Logado, mas não em jogo
  if (gameState.status === 'idle') {
    if (showTeamSetup) {
      return (
        <>
          {renderTopBar()}
          <TeamSetupScreen 
            onCancel={() => setShowTeamSetup(false)} 
            onStart={(teams, selectedGame, selectedMode) => {
              // Bug 1 fix: pass questions directly so startGame doesn't read the
              // stale closure value (React 18 batches setQuestions + startGame
              // together, so the state update hasn't flushed yet at this point).
              const qs = selectedGame?.questions || [];
              if (qs.length === 0) {
                alert('Este jogo não tem perguntas cadastradas. Adicione perguntas antes de jogar.');
                return;
              }
              setQuestions(qs);
              setShowTeamSetup(false);
              try {
                startGame(teams, selectedMode || 'cacapalavras', qs);
              } catch (err) {
                alert(err.message || 'Erro ao iniciar o jogo.');
              }
            }}
          />
        </>
      );
    }
    return (
      <>
        {renderTopBar(false)}
        <InstructorDashboard 
          onStartGameClick={() => setShowTeamSetup(true)} 
          onStartBetsGame={(teams, mode) => {
            try {
              startGame(teams, mode, [{ id: 'dummy', word: 'BETS', question: 'BETS' }]);
            } catch (err) {
              alert(err.message || 'Erro ao iniciar o jogo de Bets.');
            }
          }}
        />
      </>
    );
  }

  // 3. Jogo rodando
  if (gameState.status === 'playing') {
    return (
      <>
        {renderTopBar()}
        <GameScreen />
      </>
    );
  }

  // 4. Vitória
  if (gameState.status === 'finished') {
    return (
      <>
        {renderTopBar()}
        <VictoryScreen />
      </>
    );
  }

  return <div>Estado inválido</div>;
}
