import { useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const { resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isLogin) {
        if (showReset) {
          if (!email) throw new Error('Informe seu e-mail para receber o link.');
          await resetPassword(email);
          setSuccess('Link de redefinição enviado. Verifique seu e-mail.');
          setShowReset(false);
        } else {
          await login(email, password);
        }
      } else {
        if (name.trim().length < 2) throw new Error('Nome muito curto');
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', width: '100%', height: '100vh',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative orbs */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)', top: '-200px', left: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,122,0.06) 0%, transparent 70%)', bottom: '-150px', right: '-50px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)', top: '50%', left: '60%', pointerEvents: 'none' }} />

      <div className="glass animate-slide" style={{
        width: '100%', maxWidth: '460px', padding: '48px 40px',
        display: 'flex', flexDirection: 'column', gap: '32px',
        animation: 'borderGlow 6s infinite',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="animate-float">
            <BrandLogo />
          </div>
          <div className="badge badge-instructor">Instrutor</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '8px' }}>{isLogin ? 'Bem-vindo de volta!' : 'Criar Conta'}</h2>
          <p>{isLogin ? 'Faça login para continuar' : 'O primeiro usuário cadastrado será o Instrutor'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div className="input-wrap animate-fade">
              <label className="input-label">Nome Completo</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome..." />
            </div>
          )}
          <div className="input-wrap">
            <label className="input-label">E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="professor@escola.com" />
          </div>
          <div className="input-wrap">
            <label className="input-label">Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
          </div>

          {isLogin && (
            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <button type="button" onClick={() => { setShowReset(!showReset); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--t1)', fontWeight: '700', cursor: 'pointer' }}>
                {showReset ? 'Cancelar' : 'Esqueci a senha?'}
              </button>
            </div>
          )}

          {error && (
            <div className="animate-fade" style={{ color: 'var(--danger)', fontSize: '0.88rem', textAlign: 'center', background: 'rgba(255,51,85,0.1)', border: '1px solid rgba(255,51,85,0.2)', borderRadius: '8px', padding: '10px' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="animate-fade" style={{ color: 'var(--success)', fontSize: '0.88rem', textAlign: 'center', background: 'rgba(0,200,100,0.06)', border: '1px solid rgba(0,200,100,0.12)', borderRadius: '8px', padding: '10px' }}>
              {success}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '6px' }}>
            {loading ? '⏳ Aguarde...' : (isLogin ? (showReset ? 'Enviar link de redefinição' : '→ Entrar') : '✓ Cadastrar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--muted)' }}>
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </span>
          {' '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--t1)', fontWeight: '800', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.88rem' }}
          >
            {isLogin ? 'Cadastre-se' : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

