import { useBadges } from '../hooks/useBadges';

const EARNED_COLORS = ['#FFD700', '#00F2FF', '#FF007A', '#39FF14', '#FFBD33', '#AA88FF', '#FF6633'];

export default function BadgesPanel({ classId }) {
  const { getBadgesForClass } = useBadges();
  const badges = getBadgesForClass(classId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
      {badges.map((badge, i) => {
        const color = EARNED_COLORS[i % EARNED_COLORS.length];
        return (
          <div
            key={badge.id}
            style={{
              padding: '16px 12px',
              borderRadius: '12px',
              textAlign: 'center',
              background: badge.earned ? `${color}14` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${badge.earned ? `${color}66` : 'rgba(255,255,255,0.06)'}`,
              opacity: badge.earned ? 1 : 0.4,
              filter: badge.earned ? 'none' : 'grayscale(1)',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{badge.icon}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: badge.earned ? color : 'var(--muted)' }}>{badge.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '4px', lineHeight: '1.3' }}>{badge.desc}</div>
            {badge.earned && badge.earnedAt && (
              <div style={{ fontSize: '0.65rem', color: `${color}99`, marginTop: '6px' }}>
                {new Date(badge.earnedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
