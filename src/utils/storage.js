// helpers de localStorage com prefixo mcp_
const PREFIX = 'mcp_';

export const store = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)); }
    catch { return null; }
  },
  set: (key, value) => {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove: (key) => {
    localStorage.removeItem(PREFIX + key);
  },
  clear: () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};
