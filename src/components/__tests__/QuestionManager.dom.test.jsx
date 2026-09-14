/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionManager from '../QuestionManager.jsx';

const question = (over = {}) => ({
  id: 'q1',
  q: 'O que e um algoritmo?',
  options: ['A) Uma peca', 'B) Passos ordenados'],
  correct: 1,
  word: 'ALGORITMO',
  ...over,
});

async function open(questions, onChange = vi.fn()) {
  const user = userEvent.setup();
  render(<QuestionManager questions={questions} onChange={onChange} />);
  await user.click(screen.getByRole('button', { name: /revisar perguntas/i }));
  return { user, onChange };
}

describe('QuestionManager', () => {
  it('não renderiza nada sem perguntas', () => {
    const { container } = render(<QuestionManager questions={[]} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra quantas perguntas precisam de atenção', () => {
    render(
      <QuestionManager
        questions={[question(), question({ id: 'q2', word: '', correct: -1 })]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(/1 precisam de atencao/i)).toBeInTheDocument();
  });

  it('aponta o motivo de cada pergunta inválida', async () => {
    await open([question({ word: 'AB', correct: -1 })]);
    expect(screen.getByText(/Resposta correta nao marcada/i)).toBeInTheDocument();
    expect(screen.getByText(/Palavra muito curta/i)).toBeInTheDocument();
  });

  it('acusa palavra repetida entre perguntas', async () => {
    await open([question(), question({ id: 'q2' })]);
    expect(screen.getAllByText(/Palavra repetida/i)).toHaveLength(2);
  });

  it('clicar numa alternativa marca a resposta correta', async () => {
    const { user, onChange } = await open([question({ correct: -1 })]);
    await user.click(screen.getByRole('radio', { name: /Passos ordenados/i }));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ correct: 1 })]);
  });

  it('normaliza a palavra digitada: sem acento, sem cedilha, maiúscula', async () => {
    // Um "Ç" travava a Forca para sempre: o teclado so tem A-Z.
    const { user, onChange } = await open([question({ word: '' })]);
    await user.type(screen.getByLabelText(/Palavra Escondida/i), 'seguranç');
    const last = onChange.mock.calls.at(-1)[0][0];
    expect(last.word).toMatch(/^[A-Z]*$/);
  });

  it('remove a pergunta pelo botão de excluir', async () => {
    const { user, onChange } = await open([question(), question({ id: 'q2', word: 'FLUXOGRAMA' })]);
    await user.click(screen.getByRole('button', { name: /excluir pergunta 1/i }));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'q2' })]);
  });
});
