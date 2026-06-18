
export default function BarChart({ data = [], title = '', horizontal = false, height = 140 }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barAreaHeight = height - 50;

  return (
    <div>
      {title && (
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', letterSpacing: '1px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '14px' }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: horizontal ? 'column' : 'row', gap: horizontal ? '10px' : '8px', alignItems: horizontal ? 'stretch' : 'flex-end', height: horizontal ? 'auto' : `${height}px` }}>
        {data.map((item, i) => {
          const pct = (item.value / maxVal) * 100;
          return horizontal ? (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ minWidth: '80px', fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
              <div style={{ flex: 1, height: '22px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: item.color || 'var(--t1)', borderRadius: '4px', transition: 'width 0.6s ease-out', position: 'relative', overflow: 'hidden' }}>
                  <div className="shimmer-bar" />
                </div>
              </div>
              <div style={{ minWidth: '36px', fontSize: '0.78rem', fontWeight: '700', color: item.color || 'var(--t1)' }}>{item.value}</div>
            </div>
          ) : (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: item.color || 'var(--t1)' }}>{item.value}</div>
              <div style={{ width: '100%', height: `${(pct / 100) * barAreaHeight}px`, minHeight: '4px', background: `linear-gradient(to top, ${item.color || 'var(--t1)'}, ${item.color || 'var(--t1)'}88)`, borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease-out', position: 'relative', overflow: 'hidden' }}>
                <div className="shimmer-bar" />
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
