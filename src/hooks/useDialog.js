import { createContext, useContext } from 'react';

/**
 * Contexto do diálogo acessível que substitui window.alert/confirm/prompt.
 * Fica separado do componente para o Fast Refresh continuar funcionando.
 *
 * @typedef {Object} DialogApi
 * @property {(message: string, title?: string) => Promise<void>} alert
 * @property {(message: string, options?: object) => Promise<boolean>} confirm
 * @property {(message: string, defaultValue?: string, options?: object) => Promise<string|null>} prompt
 */

/** @type {import('react').Context<DialogApi|null>} */
export const DialogContext = createContext(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog precisa estar dentro de <DialogProvider>');
  return ctx;
}
