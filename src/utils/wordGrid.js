export const GRID_SIZE = 14;

// Retorna uma matriz [GRID_SIZE][GRID_SIZE] e as coordenadas onde a palavra foi inserida
export function generateGrid(word) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  let placed = false;
  let attempts = 0;
  let answerCoords = [];

  const directions = [
    { dr: 0, dc: 1 },  // Horizontal Direita (L -> R)
    { dr: 1, dc: 0 }   // Vertical Baixo (T -> B)
  ];

  const wordUpper = word.toUpperCase().replace(/\s/g, '');
  const len = wordUpper.length;

  // Place word
  while (!placed && attempts < 100) {
    attempts++;
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const startR = Math.floor(Math.random() * GRID_SIZE);
    const startC = Math.floor(Math.random() * GRID_SIZE);
    
    let canPlace = true;
    let coords = [];
    
    for (let i = 0; i < len; i++) {
      const tr = startR + dir.dr * i;
      const tc = startC + dir.dc * i;
      if (tr < 0 || tr >= GRID_SIZE || tc < 0 || tc >= GRID_SIZE) {
        canPlace = false;
        break;
      }
      if (grid[tr][tc] !== '' && grid[tr][tc] !== wordUpper[i]) {
        canPlace = false;
        break;
      }
      coords.push({ r: tr, c: tc, letter: wordUpper[i] });
    }
    
    if (canPlace) {
      answerCoords = coords;
      for (let i = 0; i < len; i++) {
        grid[coords[i].r][coords[i].c] = coords[i].letter;
      }
      placed = true;
    }
  }

  // Se não conseguiu, coloca forçado (fallback)
  if (!placed) {
     answerCoords = [];
     for(let i=0; i < Math.min(len, GRID_SIZE); i++) {
         grid[0][i] = wordUpper[i];
         answerCoords.push({r: 0, c: i, letter: wordUpper[i]});
     }
  }

  // Fill random
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = letters.charAt(Math.floor(Math.random() * letters.length));
      }
    }
  }

  return { grid, answerCoords };
}

// Verifica se a seleção bate com a resposta
export function validateSelection(startCoord, endCoord, answerCoords) {
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
