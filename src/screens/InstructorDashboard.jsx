import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';

import BrandLogo from '../components/BrandLogo';
import DashboardView from './dashboard/DashboardView';
import ClassesView from './dashboard/ClassesView';
import GamesView from './dashboard/GamesView';
import HistoryView from './dashboard/HistoryView';
import BetsView from './dashboard/BetsView';

const MENU_ITEMS = [
  { id: 'home',    label: 'Início',       icon: '📊', color: 'var(--t1)' },
  { id: 'classes', label: 'Minhas Turmas', icon: '👥', color: 'var(--t2)' },
  { id: 'games',   label: 'Meus Jogos',   icon: '🕹️', color: 'var(--t3)' },
  { id: 'bets',    label: 'Jogos de Bets', icon: '🎰', color: 'var(--t4)' },
  { id: 'history', label: 'Histórico',    icon: '🏆', color: 'var(--t1)' },
];

export default function InstructorDashboard({ onStartGameClick, onStartBetsGame }) {
  const { user } = useAppContext();
  const { logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('home');

  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
  const COLORS = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];
  const avatarColor = COLORS[initials.charCodeAt(0) % 4];

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: '280px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
        borderRadius: '0',
        borderRight: '1px solid var(--panel-b)',
        background: 'linear-gradient(180deg, var(--panel-b) 0%, var(--panel) 100%)',
        backdropFilter: 'blur(20px)',
        gap: '8px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px', marginTop: '8px' }}>
          <BrandLogo small />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MENU_ITEMS.map(item => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  position: 'relative', overflow: 'hidden',
                  padding: '10px 16px 10px 18px', borderRadius: '14px',
                  background: isActive ? `linear-gradient(135deg, ${item.color}22, ${item.color}08)` : 'transparent',
                  color: isActive ? item.color : 'var(--muted)',
                  border: `1px solid ${isActive ? `${item.color}40` : 'transparent'}`,
                  cursor: 'pointer', fontWeight: isActive ? '800' : '500',
                  transition: 'all 0.2s', textAlign: 'left',
                  fontFamily: 'var(--font)', fontSize: '0.95rem',
                  boxShadow: isActive ? `0 0 16px ${item.color}1a` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; } }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0, top: '18%', bottom: '18%', width: '4px',
                    borderRadius: '0 4px 4px 0', background: item.color, boxShadow: `0 0 10px ${item.color}`,
                  }} />
                )}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
                  background: isActive ? item.color : 'var(--panel-b)',
                  boxShadow: isActive ? `0 0 14px ${item.color}66` : 'none',
                  transition: 'all 0.2s',
                }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer — card flutuante com perfil, tema e logout */}
        <div style={{
          marginTop: '8px',
          padding: '14px',
          borderRadius: '20px',
          background: 'var(--panel)',
          border: '1px solid var(--panel-b)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: `${avatarColor}30`, border: `2px solid ${avatarColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '0.9rem', color: avatarColor,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={logout}
              title="Sair"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px 10px', borderRadius: '999px',
                background: 'rgba(255,51,51,0.12)', border: '1px solid rgba(255,51,51,0.3)',
                color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}
            >
              ✖ Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {activeMenu === 'home'    && <DashboardView onNavigate={setActiveMenu} />}
          {activeMenu === 'classes' && <ClassesView />}
          {activeMenu === 'games'   && <GamesView onStartGameClick={onStartGameClick} />}
          {activeMenu === 'bets'    && <BetsView onStartGame={onStartBetsGame} />}
          {activeMenu === 'history' && <HistoryView />}
        </div>
      </main>

    </div>
  );
}
