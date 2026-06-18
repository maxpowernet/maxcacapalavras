import { useState } from 'react';
import { useSound } from '../hooks/useSound';

const COLORS = ['#00F2FF', '#FF007A', '#39FF14', '#FFBD33'];

export default function QuizOverlay({ question, activeTeamId, onAnswer }) {
  const { playSound } = useSound();
  const [selectedIdx, setSelectedIdx] = useState(null);
  const color = COLORS[activeTeamId % 4];

  // Extracts RGB from hex to use in rgba
  const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };
  const rgbColor = hex2rgb(color);

  const handleSelect = (idx) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    
    const isCorrect = idx === question.correct;
    
    if (isCorrect) {
      playSound('success');
      setTimeout(() => onAnswer(true), 1200);
    } else {
      playSound('error');
      setTimeout(() => onAnswer(false), 2500);
    }
  };

  return (
    <div className="animate-fade" style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(6, 6, 15, 0.95)',
      backdropFilter: 'blur(8px)',
      borderRadius: 'var(--radius)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '24px',
        width: '100%', maxWidth: '560px',
        background: 'rgba(255,255,255,0.03)',
        padding: '30px', borderRadius: '16px',
        border: `1px solid rgba(${rgbColor}, 0.2)`
      }}>
        <h2 style={{
          textAlign: 'center', fontSize: '1.4rem', lineHeight: '1.5',
          textTransform: 'uppercase', color: '#fff', textShadow: `0 0 15px rgba(${rgbColor}, 0.5)`
        }}>
          {question.q}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {question.options.map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === question.correct;
            const showReveal = selectedIdx !== null;
            
            let bg = `rgba(${rgbColor}, 0.1)`;
            let border = `rgba(${rgbColor}, 0.3)`;
            let txtColor = `rgb(${rgbColor})`;
            
            if (showReveal) {
              if (isCorrect) {
                bg = 'rgba(57, 255, 20, 0.2)';
                border = '#39FF14';
                txtColor = '#39FF14';
              } else if (isSelected && !isCorrect) {
                bg = 'rgba(255, 51, 51, 0.2)';
                border = '#ff3333';
                txtColor = '#ff3333';
              } else {
                bg = 'rgba(255,255,255,0.02)';
                border = 'rgba(255,255,255,0.1)';
                txtColor = 'rgba(255,255,255,0.3)';
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedIdx !== null}
                onClick={() => handleSelect(idx)}
                style={{
                  background: bg, border: `1px solid ${border}`, color: txtColor,
                  padding: '14px 20px', borderRadius: '10px',
                  fontFamily: 'var(--font)', fontSize: '1.05rem', fontWeight: '600',
                  textAlign: 'left', cursor: selectedIdx !== null ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isSelected && !isCorrect ? 'translateX(5px)' : 'none'
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
