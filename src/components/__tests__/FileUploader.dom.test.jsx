/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// parseFile carrega o pdf.js (worker via ?url): fora do escopo destes testes,
// que cobrem a tela de revisao.
const parseFile = vi.hoisted(() => vi.fn());
vi.mock('../../utils/parseFile', () => ({
  parseFile,
  isSupportedFile: (f) => /\.(pdf|txt)$/i.test(f?.name || ''),
}));

import FileUploader from '../FileUploader.jsx';

const txt = (name = 'perguntas.txt') =>
  new File(['conteudo'], name, { type: 'text/plain' });

const question = (over = {}) => ({
  id: 'q1',
  q: 'O que e um algoritmo?',
  options: ['A) Uma peca', 'B) Passos ordenados'],
  correct: 1,
  word: 'ALGORITMO',
  ...over,
});

async function upload(file = txt()) {
  const user = userEvent.setup();
  const onQuestionsLoaded = vi.fn();
  const { container } = render(<FileUploader onQuestionsLoaded={onQuestionsLoaded} />);
  const input = /** @type {HTMLInputElement} */ (container.querySelector('input[type="file"]'));
  await user.upload(input, file);
  return { user, onQuestionsLoaded };
}

beforeEach(() => parseFile.mockReset());

describe('FileUploader — leitura', () => {
  it('recusa arquivo que não é PDF nem TXT', async () => {
    // Pelo seletor o atributo accept ja filtra; o caminho real de um arquivo
    // invalido chegar e o arrastar-e-soltar.
    render(<FileUploader onQuestionsLoaded={vi.fn()} />);
    const dropzone = screen.getByRole('button', { name: /Importar perguntas/i });
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [new File(['x'], 'foto.png', { type: 'image/png' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/PDF ou TXT/i);
    expect(parseFile).not.toHaveBeenCalled();
  });

  it('avisa quando o arquivo não tem nenhuma pergunta', async () => {
    parseFile.mockResolvedValue([]);
    await upload();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Nenhuma pergunta encontrada/i);
  });

  // NAO COBERTO AQUI: parseFile rejeitando (ex.: "PDF digitalizado, use
  // OCR"). O componente trata corretamente e a mensagem chega ao role="alert"
  // — verificado manualmente —, mas o React 19 reporta ao ambiente mesmo o
  // erro ja capturado no handler, e o Vitest derruba a suite por "unhandled
  // error". Silenciar isso exigiria dangerouslyIgnoreUnhandledErrors, que
  // esconderia falhas reais. O mesmo bloco catch e o mesmo caminho ate a tela
  // ja estao cobertos pelo teste acima, que lanca de dentro do try.
});

describe('FileUploader — revisão', () => {
  it('libera a confirmação quando todas as perguntas estão válidas', async () => {
    parseFile.mockResolvedValue([question(), question({ id: 'q2', word: 'FLUXOGRAMA' })]);
    const { user, onQuestionsLoaded } = await upload();

    const confirmar = await screen.findByRole('button', { name: /Confirmar e Adicionar/i });
    expect(confirmar).toBeEnabled();
    await user.click(confirmar);
    expect(onQuestionsLoaded).toHaveBeenCalledWith([
      expect.objectContaining({ word: 'ALGORITMO', correct: 1 }),
      expect.objectContaining({ word: 'FLUXOGRAMA' }),
    ]);
  });

  it('bloqueia a confirmação quando falta a resposta correta', async () => {
    // O parser deixa correct: -1 quando nao consegue detectar; antes isso
    // passava direto e a pergunta entrava no jogo sem resposta.
    parseFile.mockResolvedValue([question({ correct: -1 })]);
    await upload();

    expect(await screen.findByRole('button', { name: /Resolva 1 pendencia/i })).toBeDisabled();
    expect(screen.getByText(/Resposta correta nao marcada/i)).toBeInTheDocument();
  });

  it('bloqueia palavras repetidas entre perguntas', async () => {
    parseFile.mockResolvedValue([question(), question({ id: 'q2' })]);
    await upload();
    expect(await screen.findByRole('button', { name: /Resolva 2 pendencia/i })).toBeDisabled();
  });

  it('marcar a alternativa correta resolve a pendência', async () => {
    parseFile.mockResolvedValue([question({ correct: -1 })]);
    const { user } = await upload();

    await user.click(await screen.findByRole('radio', { name: /Passos ordenados/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Confirmar e Adicionar/i })).toBeEnabled()
    );
  });

  it('normaliza a palavra digitada para A-Z sem acento', async () => {
    parseFile.mockResolvedValue([question({ word: '' })]);
    const { user } = await upload();

    const campo = await screen.findByLabelText(/Palavra Escondida/i);
    await user.type(campo, 'proteção');
    expect(campo).toHaveValue('PROTECAO');
  });

  it('permite remover uma pergunta da revisão', async () => {
    parseFile.mockResolvedValue([question(), question({ id: 'q2', word: 'FLUXOGRAMA' })]);
    const { user } = await upload();

    await user.click(await screen.findByRole('button', { name: /Remover pergunta 1/i }));
    expect(screen.getByRole('heading', { name: /1 perguntas encontradas/i })).toBeInTheDocument();
  });
});
