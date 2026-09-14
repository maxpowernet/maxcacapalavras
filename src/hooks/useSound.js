import { useEffect } from 'react';

// AudioContext unico do modulo.
//
// Antes cada montagem de useSound criava um AudioContext e o cleanup so
// removia o listener, sem nunca chamar close(). Como GameScreen remonta a tela
// a cada pergunta (key={currentQuestionId}) e QuizOverlay usa este hook, era um
// contexto vazado por pergunta. O Chrome limita ~6 contextos simultaneos: a
// partir dai o "new AudioContext()" lancava dentro do efeito e a partida caia
// no ErrorBoundary com "Algo deu errado".
let sharedCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    try {
      sharedCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

export function useSound() {
  useEffect(() => {
    // Resume no primeiro clique (política de autoplay do browser)
    const resumeAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    window.addEventListener('click', resumeAudio);
    return () => window.removeEventListener('click', resumeAudio);
  }, []);

  const playSound = (type) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Libera os nos assim que o som termina — antes ficavam conectados.
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.disconnect();
      gain.disconnect();
    }
  };

  return { playSound };
}
