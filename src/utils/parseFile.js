import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';

// Worker via CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

// ─── Stop-words em português para não usar como palavra-chave ───────────────
const STOP_WORDS = new Set([
  'DE','DO','DA','DOS','DAS','EM','NO','NA','NOS','NAS','A','O','OS','AS',
  'E','OU','QUE','COM','SEM','POR','PARA','AO','AOS','AS','ATÉ','MAIS',
  'NÃO','SE','UM','UMA','UNS','UMAS','É','SÃO','FOI','SER','ESTÁ','PELO','PELA',
]);

/**
 * Exporta uma lista de perguntas com o seguinte formato:
 * { id, q, options: string[], correct: number (0-based), word: string }
 *
 * Suporta dois formatos de entrada:
 *
 * 1. FORMATO TEXTO (TXT):
 *    Pergunta: Qual a capital do Brasil?
 *    A) Buenos Aires
 *    B) Rio de Janeiro
 *    C) Brasília
 *    D) São Paulo
 *    Correta: C
 *    Palavra: BRASILIA
 *
 * 2. FORMATO PDF (estilo "Questão N" com resposta em negrito):
 *    Questão 1
 *    Qual o objetivo da NR-12?
 *    A) **Prevenir acidentes** ← em negrito = correta
 *    B) Definir jornada
 *    ...
 *    A palavra-chave é extraída automaticamente da resposta correta.
 */
export async function parseFile(file) {
  if (file.type === 'application/pdf') {
    return parsePDF(file);
  }
  const text = await file.text();
  return parseTextFormat(text);
}

// ─── Formato TXT (legado) ────────────────────────────────────────────────────
function parseTextFormat(rawText) {
  const questions = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let currentQ = null;

  for (const line of lines) {
    if (line.toLowerCase().startsWith('pergunta:')) {
      if (isValidQ(currentQ)) questions.push(currentQ);
      currentQ = { id: uuidv4(), q: line.substring(9).trim(), options: [], correct: null, word: '' };
    } else if (currentQ) {
      if (/^[A-Ea-e][):.]/.test(line)) {
        currentQ.options.push(line);
      } else if (line.toLowerCase().startsWith('correta:')) {
        const letter = line.split(':')[1].trim().toUpperCase();
        currentQ.correct = letter.charCodeAt(0) - 65;
      } else if (line.toLowerCase().startsWith('palavra:')) {
        currentQ.word = line.split(':')[1].trim().toUpperCase().replace(/\s/g, '');
      }
    }
  }
  if (isValidQ(currentQ)) questions.push(currentQ);
  return questions;
}

function isValidQ(q) {
  return q && q.options.length >= 2 && q.word && q.correct !== null;
}

// ─── Formato PDF (Questão N + negrito para resposta correta) ─────────────────
async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // 1. Coletar todas as linhas de todas as páginas
  let boldFont = null;
  const allRows = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Detectar fonte negrito (usada em "Questão N" e nas respostas corretas)
    if (!boldFont) {
      for (const item of content.items) {
        if (/Questão\s+\d+/i.test(item.str)) {
          boldFont = item.fontName;
          break;
        }
      }
    }

    // Agrupar itens por posição Y (linha), tolerância de 3pt
    const pageRows = [];
    for (const item of content.items) {
      if (!item.str.trim()) continue;
      const y = item.transform[5];
      const found = pageRows.find(r => Math.abs(r.y - y) <= 3);
      if (found) {
        found.items.push(item);
      } else {
        pageRows.push({ y, items: [item] });
      }
    }

    // Ordenar: de cima para baixo (Y decrescente dentro da página)
    pageRows.sort((a, b) => b.y - a.y);
    for (const row of pageRows) {
      row.items.sort((a, b) => a.transform[4] - b.transform[4]);
      row.text = row.items.map(i => i.str).join(' ').trim();
    }

    allRows.push(...pageRows);
  }

  // 2. Reconstruir perguntas
  const questions = [];
  let cur = null;

  for (const row of allRows) {
    const txt = row.text;

    // Ignorar cabeçalhos/rodapés típicos
    if (
      /^QUIS\s+NR/i.test(txt) ||
      /^Segurança do Trabalho/i.test(txt) ||
      /^\d+\s*\/\s*\d+$/.test(txt)
    ) continue;

    // Nova questão
    if (/^Questão\s+\d+/i.test(txt)) {
      if (cur) questions.push(cur);
      cur = {
        id: uuidv4(),
        q: txt.replace(/^Questão\s+\d+\s*/i, '').trim(),
        options: [],
        correct: -1,
        word: '',
      };
      continue;
    }

    if (!cur) continue;

    // Alternativa A–D
    const optMatch = txt.match(/^([A-D])\)\s*(.*)/i);
    if (optMatch) {
      const letter = optMatch[1].toUpperCase();
      const optText = optMatch[2].trim();

      // Verificar se algum item desta linha (exceto a letra) usa a fonte negrito
      const isBold = row.items.some(item => {
        if (/^[A-D]\)$/i.test(item.str.trim())) return false;
        return item.fontName === boldFont;
      });

      cur.options.push(`${letter}) ${optText}`);
      if (isBold) {
        cur.correct = letter.charCodeAt(0) - 65;
        // Palavra-chave: maior palavra significativa da resposta correta
        cur.word = extractKeyword(optText);
      }
    } else {
      // Continuação de texto (pergunta multilinha ou última opção multilinha)
      if (cur.options.length > 0) {
        // Continuação da última alternativa
        const last = cur.options[cur.options.length - 1];
        cur.options[cur.options.length - 1] = last + ' ' + txt;

        // Também verifica se esta linha continuação tem negrito
        const isBold = row.items.some(i => i.fontName === boldFont);
        if (isBold && cur.correct === -1) {
          const lastLetter = last.charAt(0).toUpperCase();
          cur.correct = lastLetter.charCodeAt(0) - 65;
          cur.word = extractKeyword(last.replace(/^[A-D]\)\s*/i, '') + ' ' + txt);
        }
      } else {
        // Continuação da pergunta
        cur.q += ' ' + txt;
      }
    }
  }

  if (cur) questions.push(cur);

  // 3. Limpar questões sem resposta correta detectada e retornar
  return questions.filter(q => q.options.length >= 2);
}

/**
 * Extrai a palavra-chave mais significativa de um texto:
 * - Remove stop-words
 * - Prefere palavras mais longas
 * - Remove acentos e caracteres especiais
 * - Retorna em maiúsculas sem espaços
 */
function extractKeyword(text) {
  const words = text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));

  if (words.length === 0) {
    // fallback: primeira palavra sem acento
    return text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '').slice(0, 12);
  }

  // Ordena pela maior comprimento
  words.sort((a, b) => b.length - a.length);
  return words[0].slice(0, 15); // limita a 15 chars para o grid
}
