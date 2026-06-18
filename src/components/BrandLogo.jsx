
const BrandLogo = ({ interactive = false, onClick = null, small = false }) => {
  const boxStyle = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    borderRadius: '4px', fontWeight: '800',
    width: small ? '21px' : '28px',
    height: small ? '21px' : '28px',
    fontSize: small ? '0.7rem' : '1.1rem',
  };

  const lBox = { ...boxStyle, background: '#F0F8FF', color: '#001C3D', boxShadow: '0 0 8px rgba(240,248,255,0.8)' };

  const c1 = { ...boxStyle, background: 'var(--t1)', color: '#000' };
  const c2 = { ...boxStyle, background: 'var(--t2)', color: '#000' };
  const c3 = { ...boxStyle, background: 'var(--t3)', color: '#000' };
  const c4 = { ...boxStyle, background: 'var(--t4)', color: '#000' };
  const dashBox = { ...boxStyle, background: 'transparent', boxShadow: 'none', color: 'var(--muted)' };

  const cycle = [c1, c2, c3, c4];
  const renderWord = (word) => word.split('').map((ch, i) => <span key={i} style={cycle[i % cycle.length]}>{ch}</span>);

  return (
    <div 
      style={{
        display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
        padding: '16px', borderRadius: '12px',
        background: interactive ? 'rgba(0,242,255,0.05)' : 'transparent',
        border: interactive ? '1px solid rgba(0,242,255,0.2)' : 'none',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'all 0.3s ease'
      }}
      onClick={onClick}
      className={interactive ? 'brand-interactive' : ''}
      title={interactive ? 'Voltar' : ''}
    >
      {/* MAX - JOGOS */}
      <div style={{ display: 'flex', gap: small ? '2px' : '4px' }}>
        <span style={lBox}>M</span><span style={lBox}>A</span><span style={lBox}>X</span>
        <span style={dashBox}>-</span>
        {renderWord('JOGOS')}
      </div>

      {/* INTERATIVOS */}
      <div style={{ display: 'flex', gap: small ? '2px' : '4px' }}>
        {renderWord('INTERATIVOS')}
      </div>
    </div>
  );
};

export default BrandLogo;
