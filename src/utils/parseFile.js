import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';

// Define o worker local (precisa estar no public dir, mas o Vite carrega via import também)
// Usaremos a versão minificada do CDN para simplificar no browser se não configurar worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

/**
 * Formato esperado no texto (cada bloco separado por quebra de linha dupla ou similar):
 * Pergunta: Qual a capital do Brasil?
 * A) Buenos Aires
 * B) Rio de Janeiro
 * C) Brasília
 * D) São Paulo
 * Correta: C
 * Palavra: BRASILIA
 */

export async function parseFile(file) {
  // Bug 7 fix: removed useless `= ''` initialisation — text is always assigned
  // by one of the two branches below before it is used.
  let text;
  if (file.type === 'application/pdf') {
    text = await extractTextFromPDF(file);
  } else {
    text = await file.text();
  }

  return parseTextToQuestions(text);
}

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }
  
  return fullText;
}

function parseTextToQuestions(rawText) {
  const questions = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentQ = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.toLowerCase().startsWith('pergunta:')) {
      if (currentQ && currentQ.options.length >= 2 && currentQ.word && currentQ.correct !== null) {
        questions.push(currentQ);
      }
      currentQ = { id: uuidv4(), q: line.substring(9).trim(), options: [], correct: null, word: '' };
    } 
    else if (currentQ) {
      if (/^[A-Ea-e][):.]/.test(line)) {
        currentQ.options.push(line);
      } 
      else if (line.toLowerCase().startsWith('correta:')) {
        const letter = line.split(':')[1].trim().toUpperCase();
        // A=0, B=1, C=2, D=3, E=4
        currentQ.correct = letter.charCodeAt(0) - 65;
      } 
      else if (line.toLowerCase().startsWith('palavra:')) {
        currentQ.word = line.split(':')[1].trim().toUpperCase().replace(/\s/g, '');
      }
    }
  }

  // push last
  if (currentQ && currentQ.options.length >= 2 && currentQ.word && currentQ.correct !== null) {
    questions.push(currentQ);
  }

  return questions;
}
