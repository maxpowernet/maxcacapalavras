import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sem globals:true o Testing Library nao limpa a arvore entre os testes e o
// segundo render encontra elementos duplicados.
afterEach(() => cleanup());
