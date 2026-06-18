import { useEffect, useState, useRef } from 'react';

// Bug 3 fix: store onTimeout/onTick in refs so they never appear in the
// useEffect dependency array. Without this, an inline arrow onTimeout creates
// a new function reference on every render (e.g. every hover cell in WordGrid),
// causing the effect to re-run and reset the timer countdown to 0 each time.
export default function TimerDisplay({ duration, onTimeout, active, onTick }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeoutRef = useRef(onTimeout);
  const onTickRef    = useRef(onTick);

  // Keep refs current without triggering the timer effect
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);
  useEffect(() => { onTickRef.current    = onTick;    }, [onTick]);

  useEffect(() => {
    if (!active) return;
    // No synchronous setTimeLeft here: useState(duration) initialises the value
    // correctly on mount. Each use-site remounts TimerDisplay when it needs a
    // fresh countdown (e.g. via key), so a synchronous reset in the effect
    // body is never needed and would trigger set-state-in-effect lint errors.
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (onTickRef.current) onTickRef.current(next);
        if (next <= 0) {
          clearInterval(interval);
          if (onTimeoutRef.current) onTimeoutRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, duration]); // intentionally excludes onTimeout/onTick — handled via refs above

  const isWarning = timeLeft <= 5 && timeLeft > 0;

  return (
    <div style={{
      fontSize: '3rem', fontWeight: '800', textAlign: 'center',
      color: isWarning ? 'var(--danger)' : 'var(--text)',
      textShadow: isWarning ? '0 0 20px rgba(255,51,51,0.6)' : 'none',
      background: 'var(--panel)',
      border: '1px solid var(--panel-b)',
      padding: '10px 20px', borderRadius: '12px',
      animation: isWarning ? 'pulse 0.5s infinite alternate' : 'none'
    }}>
      {timeLeft}s
    </div>
  );
}
