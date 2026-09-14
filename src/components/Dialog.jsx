import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DialogContext } from '../hooks/useDialog';

/**
 * Substitui window.alert / confirm / prompt por um diálogo acessível.
 *
 * Os nativos travam a thread, não seguem o tema da aplicação, não funcionam
 * bem em tela cheia (o caso de uso do projeto: telas interativas LG) e não
 * podem ser testados. Aqui cada chamada devolve uma Promise.
 */
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [value, setValue] = useState('');
  const resolveRef = useRef(null);
  const inputRef = useRef(null);
  const confirmRef = useRef(null);

  const open = useCallback((config) => new Promise((resolve) => {
    resolveRef.current = resolve;
    setValue(config.defaultValue ?? '');
    setDialog(config);
  }), []);

  const close = useCallback((result) => {
    setDialog(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const api = useMemo(() => ({
    alert: (message, title) => open({ kind: 'alert', message, title }),
    confirm: (message, options = {}) => open({ kind: 'confirm', message, ...options }),
    prompt: (message, defaultValue = '', options = {}) =>
      open({ kind: 'prompt', message, defaultValue, ...options }),
  }), [open]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(dialog.kind === 'alert' ? undefined : dialog.kind === 'prompt' ? null : false);
    };
    window.addEventListener('keydown', onKey);
    // Foco inicial: o campo no prompt, o botão de confirmar nos demais.
    const target = dialog.kind === 'prompt' ? inputRef.current : confirmRef.current;
    target?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  const cancelResult = dialog?.kind === 'prompt' ? null : false;

  return (
    <DialogContext.Provider value={api}>
      {children}

      {dialog && (
        <div
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget && dialog.kind !== 'alert') close(cancelResult); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-message"
            onSubmit={(e) => {
              e.preventDefault();
              close(dialog.kind === 'prompt' ? value : true);
            }}
            className="glass"
            style={{
              width: '100%', maxWidth: '460px', padding: '28px',
              display: 'flex', flexDirection: 'column', gap: '18px',
            }}
          >
            {dialog.title && <h3 style={{ margin: 0 }}>{dialog.title}</h3>}

            <p id="dialog-message" style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {dialog.message}
            </p>

            {dialog.kind === 'prompt' && (
              <div className="input-wrap" style={{ margin: 0 }}>
                <label className="input-label" htmlFor="dialog-input">{dialog.label || 'Resposta'}</label>
                <input
                  id="dialog-input"
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {dialog.kind !== 'alert' && (
                <button type="button" className="btn btn-secondary" onClick={() => close(cancelResult)}>
                  {dialog.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                type="submit"
                ref={confirmRef}
                className={dialog.danger ? 'btn btn-danger' : 'btn btn-primary'}
              >
                {dialog.confirmText || 'OK'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DialogContext.Provider>
  );
}
