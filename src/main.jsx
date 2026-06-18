import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './context/AppContext.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '3rem' }}>💥</div>
          <h2 style={{ color: '#fff' }}>Algo deu errado</h2>
          <p style={{ color: '#aaa', maxWidth: '420px' }}>
            {this.state.error?.message || 'Erro inesperado na aplicação.'}
          </p>
          <button
            style={{ padding: '12px 28px', background: '#00F2FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}
            onClick={() => { this.setState({ hasError: false, error: null }); }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
