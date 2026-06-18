import { useState, useEffect } from 'react';
import { store } from '../utils/storage';

export function useTheme() {
  const [isLightMode, setIsLightMode] = useState(() => {
    return store.get('theme') === 'light';
  });

  useEffect(() => {
    store.set('theme', isLightMode ? 'light' : 'dark');
    if (isLightMode) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightMode]);

  const toggleTheme = () => setIsLightMode(prev => !prev);

  return { isLightMode, toggleTheme };
}
