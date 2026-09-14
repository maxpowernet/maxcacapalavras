export const GRID_SIZE = 14;

// Limites da palavra escondida. MAX_WORD_LEN fica abaixo de GRID_SIZE para que
// a palavra caiba na grade com alguma folga de posicionamento; e' a fonte unica
// da verdade usada tambem pelo extrator de palavras-chave e pela validacao da UI.
export const MAX_WORD_LEN = 12;
export const MIN_WORD_LEN = 4;

/**
 * Normaliza uma palavra para o formato que a grade e a Forca conseguem jogar:
 * maiusculas, sem acentos, sem espacos e apenas A-Z0-9.
 * A Forca so tem teclado A-Z, entao um "C" cedilhado tornaria a rodada
 * impossivel de completar.
 */
/**
 * @param {unknown} raw
 * @returns {string}
 */
export function sanitizeWord(raw) {
  return String(raw ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Retorna { grid, answerCoords, word }.
 *
 * `word` e' a palavra REALMENTE colocada na grade (ja normalizada e limitada ao
 * tamanho da grade) — a tela deve exibir este valor, e nao o original, para que
 * nunca se peca ao jogador uma palavra que nao esta la.
 */
/**
 * @param {string} rawWord
 * @returns {{ grid: string[][], answerCoords: {r:number,c:number,letter:string}[], word: string }}
 */
export function generateGrid(rawWord) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const word = sanitizeWord(rawWord).slice(0, GRID_SIZE);
  const len = word.length;

  let answerCoords = [];

  const directions = [
    { dr: 0, dc: 1 },  // Horizontal Direita (L -> R)
    { dr: 1, dc: 0 }   // Vertical Baixo (T -> B)
  ];

  if (len > 0) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      // Sorteia apenas posicoes onde a palavra inteira cabe.
      const maxR = GRID_SIZE - (dir.dr * (len - 1));
      const maxC = GRID_SIZE - (dir.dc * (len - 1));
      const startR = Math.floor(Math.random() * maxR);
      const startC = Math.floor(Math.random() * maxC);

      const coords = [];
      for (let i = 0; i < len; i++) {
        coords.push({ r: startR + dir.dr * i, c: startC + dir.dc * i, letter: word[i] });
      }

      answerCoords = coords;
      for (let i = 0; i < len; i++) {
        grid[coords[i].r][coords[i].c] = coords[i].letter;
      }
      placed = true;
    }

    // Fallback defensivo: coloca na linha 0 a partir da coluna 0.
    // `word` ja foi limitada a GRID_SIZE, entao cabe por completo e
    // answerCoords sempre cobre a palavra inteira.
    if (!placed) {
      answerCoords = [];
      for (let i = 0; i < len; i++) {
        grid[0][i] = word[i];
        answerCoords.push({ r: 0, c: i, letter: word[i] });
      }
    }
  }

  // Preenche o resto com letras aleatorias
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = letters.charAt(Math.floor(Math.random() * letters.length));
      }
    }
  }

  return { grid, answerCoords, word };
}

// Verifica se a selecao bate com a resposta
export function validateSelection(startCoord, endCoord, answerCoords) {
  // Palavra vazia/invalida: nenhuma selecao pode ser valida, entao nao deixamos
  // a rodada virar um beco sem saida silencioso.
  if (!answerCoords || answerCoords.length === 0) {
    return { valid: false, coords: [] };
  }

  const r1 = startCoord.r;
  const c1 = startCoord.c;
  const r2 = endCoord.r;
  const c2 = endCoord.c;

  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);

  // Apenas horizontal (dr=0) ou vertical (dc=0)
  if (dr !== 0 && dc !== 0) {
    return { valid: false, coords: [] };
  }

  const selectedCoords = [];
  const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  for (let i = 0; i <= steps; i++) {
    selectedCoords.push({ r: r1 + dr * i, c: c1 + dc * i });
  }

  if (selectedCoords.length === answerCoords.length) {
    const forward = selectedCoords.every((coord, idx) =>
      coord.r === answerCoords[idx].r && coord.c === answerCoords[idx].c
    );
    const backward = selectedCoords.every((coord, idx) =>
      coord.r === answerCoords[answerCoords.length - 1 - idx].r &&
      coord.c === answerCoords[answerCoords.length - 1 - idx].c
    );

    if (forward || backward) {
        return { valid: true, coords: selectedCoords };
    }
  }

  return { valid: false, coords: [] };
}
