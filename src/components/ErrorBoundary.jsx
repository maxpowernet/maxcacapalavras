import React from 'react';

/**
 * Barreira de erro reutilizável.
 *
 * Antes só existia uma barreira global no main.jsx: qualquer erro dentro de um
 * modo de jogo derrubava a aplicação inteira. Envolvendo cada tela, o erro
 * fica contido e o instrutor consegue voltar sem perder o resto da sessão.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`Erro em ${this.props.label || 'componente'}:`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: this.props.inline ? '320px' : '100vh',
          gap: '20px', padding: '40px', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem' }} aria-hidden="true">💥</div>
        <h2>Algo deu errado{this.props.label ? ` em ${this.props.label}` : ''}</h2>
        <p style={{ color: 'var(--muted)', maxWidth: '420px' }}>
          {this.state.error?.message || 'Erro inesperado na aplicação.'}
        </p>
        <button type="button" className="btn btn-primary" onClick={this.handleReset}>
          {this.props.resetLabelText || 'Tentar novamente'}
        </button>
      </div>
    );
  }
}
