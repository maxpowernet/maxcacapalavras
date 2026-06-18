import { useAppContext } from '../context/AppContext';

const BADGES = [
  {
    id: 'first_win',
    icon: '🥇',
    name: 'Primeira Vitória',
    desc: 'Ganhou o primeiro jogo',
    check: (history, classId) => history.some(h => h.classId === classId),
  },
  {
    id: 'fastest',
    icon: '⚡',
    name: 'Mais Rápidos',
    desc: 'Completou uma partida em menos de 5 minutos',
    check: (history, classId) => history.some(h => h.classId === classId && h.durationSeconds > 0 && h.durationSeconds < 300),
  },
  {
    id: 'brains',
    icon: '🧠',
    name: 'Cérebros da Turma',
    desc: 'Equipe acumulou mais de 80 pontos em uma partida',
    check: (history, classId) => history.some(h => h.classId === classId && h.teams && h.teams.some(t => t.score >= 80)),
  },
  {
    id: 'precision',
    icon: '🎯',
    name: 'Precisão Total',
    desc: 'Venceu o modo Eliminação até o nível 5',
    check: (history, classId) => history.some(h => h.classId === classId && h.gameMode === 'eliminacao'),
  },
  {
    id: 'versatile',
    icon: '🎮',
    name: 'Versátil',
    desc: 'Jogou 3 modos de jogo diferentes',
    check: (history, classId) => {
      const modes = new Set(history.filter(h => h.classId === classId).map(h => h.gameMode).filter(Boolean));
      return modes.size >= 3;
    },
  },
  {
    id: 'veteran',
    icon: '🏆',
    name: 'Veteranos',
    desc: 'Completou 5 ou mais partidas',
    check: (history, classId) => history.filter(h => h.classId === classId).length >= 5,
  },
];

export function useBadges() {
  const { history } = useAppContext();

  const getBadgesForClass = (classId) => {
    return BADGES.map(badge => ({
      ...badge,
      earned: badge.check(history, classId),
      earnedAt: badge.check(history, classId)
        ? (history.filter(h => h.classId === classId).sort((a, b) => (a.date || 0) - (b.date || 0))[0]?.date || null)
        : null,
    }));
  };

  return { getBadgesForClass, allBadges: BADGES };
}
