import { MAX_WORD_LEN, MIN_WORD_LEN, sanitizeWord } from './wordGrid.js';

// Conectivos e auxiliares: nao dizem nada sobre o assunto.
const STOP_WORDS = new Set([
  'DE', 'DO', 'DA', 'DOS', 'DAS', 'EM', 'NO', 'NA', 'NOS', 'NAS', 'A', 'O',
  'OS', 'AS', 'E', 'OU', 'QUE', 'COM', 'SEM', 'POR', 'PARA', 'AO', 'AOS',
  'ATE', 'MAIS', 'MENOS', 'NAO', 'SIM', 'SE', 'UM', 'UMA', 'UNS', 'UMAS',
  'ESTE', 'ESTA', 'ESSE', 'ESSA', 'AQUELE', 'AQUELA', 'ISSO', 'ISTO',
  'SEU', 'SUA', 'SEUS', 'SUAS', 'PELO', 'PELA', 'PELOS', 'PELAS',
  'NUM', 'NUMA', 'DUM', 'DUMA', 'LHE', 'LHES', 'ELE', 'ELA',
  'ELES', 'ELAS', 'EU', 'TU', 'VOS', 'MEU', 'MINHA',
  'SER', 'ESTAR', 'TER', 'HAVER', 'FAZER', 'SAO', 'FOI', 'FORAM',
  'ESTAO', 'TEM', 'SERA', 'SERAO', 'DEVE', 'DEVEM', 'PODE',
  'PODEM', 'FICA', 'FICAM', 'VAI', 'VAO',
]);

// Termos de "casca" de prova: aparecem em qualquer questao de multipla escolha
// e nao identificam o conteudo. Sao os responsaveis pelos VERDADEIRO x3 de hoje.
const GENERIC_WORDS = new Set([
  'VERDADEIRO', 'VERDADEIRA', 'VERDADEIROS', 'VERDADEIRAS', 'VERDADE',
  'FALSO', 'FALSA', 'FALSOS', 'FALSAS',
  'TODAS', 'TODOS', 'TODA', 'TODO', 'NENHUMA', 'NENHUM', 'AMBAS', 'AMBOS',
  'ALTERNATIVA', 'ALTERNATIVAS', 'OPCAO', 'OPCOES', 'ACIMA', 'ABAIXO',
  'APENAS', 'SOMENTE', 'TAMBEM', 'PORQUE', 'QUANDO', 'ONDE', 'SOBRE',
  'QUAL', 'QUAIS', 'COMO', 'QUANTO', 'QUANTOS', 'QUANTA', 'QUANTAS',
  'SEGUINTE', 'SEGUINTES', 'CORRETA', 'CORRETO', 'CORRETAS', 'CORRETOS',
  'INCORRETA', 'INCORRETO', 'ERRADA', 'ERRADO', 'CERTA', 'CERTO',
  'PRINCIPAL', 'PRINCIPAIS', 'MELHOR', 'PIOR', 'MAIOR', 'MENOR',
  'SEMPRE', 'NUNCA', 'JAMAIS', 'TALVEZ', 'MUITO', 'MUITA', 'POUCO',
  'OUTRO', 'OUTRA', 'OUTROS', 'OUTRAS', 'MESMO', 'MESMA',
  'ASSIM', 'ENTAO', 'PORTANTO', 'CONTUDO', 'ENTRETANTO', 'POREM',
  'CASO', 'CASOS', 'FORMA', 'FORMAS', 'MANEIRA', 'MODO', 'TIPO', 'TIPOS',
  'PARTE', 'PARTES', 'COISA', 'COISAS', 'ITEM', 'ITENS',
  'REAL', 'CERCA', 'DEVIDO', 'ATRAVES', 'DENTRO', 'FORA', 'ANTES', 'DEPOIS',
  'DURANTE', 'ENQUANTO', 'AINDA', 'APOS', 'CADA', 'ALGUM', 'ALGUNS',
  'SIGLA', 'SIGNIFICA', 'SIGNIFICADO', 'REFERE', 'TRATA', 'INDICA',
  'EXISTE', 'EXISTEM', 'POSSUI', 'POSSUEM', 'REQUER', 'PRECISA',
  // Participios de referencia: apontam para outra coisa, nao sao o assunto.
  'MENCIONADA', 'MENCIONADO', 'MENCIONADAS', 'MENCIONADOS',
  'CITADA', 'CITADO', 'CITADAS', 'CITADOS',
  'DESCRITA', 'DESCRITO', 'DENOMINADA', 'DENOMINADO',
  'CHAMADA', 'CHAMADO', 'CONHECIDA', 'CONHECIDO',
  'REFERIDA', 'REFERIDO', 'INDICADA', 'INDICADO',
  'APRESENTADA', 'APRESENTADO', 'RELACIONADA', 'RELACIONADO',
  'CONSIDERADA', 'CONSIDERADO',
]);

/** Divide um texto em tokens normalizados (maiusculas, sem acento, so A-Z0-9). */
function tokenize(text) {
  return String(text == null ? '' : text)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Remove o prefixo "A) " / "A. " / "(A) " de uma alternativa. */
export function stripOptionPrefix(text) {
  return String(text == null ? '' : text)
    .replace(/^\s*\(?\s*[A-Ea-e]\s*[).:-]\s*/, '')
    .trim();
}

function isUsable(word) {
  return (
    word.length >= MIN_WORD_LEN &&
    word.length <= MAX_WORD_LEN &&
    !STOP_WORDS.has(word) &&
    /^[A-Z]+$/.test(word)
  );
}

function scoreCandidates(answerText, questionText, taken) {
  const answerTokens = tokenize(answerText);
  const questionTokens = tokenize(questionText);

  const inAnswer = new Set(answerTokens);
  const questionPos = new Map();
  questionTokens.forEach((w, i) => {
    if (!questionPos.has(w)) questionPos.set(w, i);
  });

  const scored = new Map();

  for (const word of [...answerTokens, ...questionTokens]) {
    if (!isUsable(word) || scored.has(word)) continue;

    const fromQuestion = questionPos.has(word);
    const fromAnswer = inAnswer.has(word);

    let score = word.length;

    // Aparece nos dois lados: quase certamente e o tema da questao.
    if (fromQuestion && fromAnswer) score += 6;
    else if (fromQuestion) score += 2;

    // Nas perguntas o assunto costuma vir logo no inicio
    // ("Qual OPERADOR requer que..."), entao damos um empurrao de posicao.
    if (fromQuestion) score += Math.max(0, 3 - Math.floor(questionPos.get(word) / 3));

    if (GENERIC_WORDS.has(word)) score -= 12;

    // Ja usada por outra questao desta importacao: evita VERDADEIRO x3.
    if (taken.has(word)) score -= 9;

    scored.set(word, score);
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]))
    .map((entry) => entry[0]);
}

/**
 * Escolhe a palavra escondida de uma questao.
 *
 * A intuicao: o termo do assunto costuma estar na PERGUNTA ("O que e um
 * algoritmo?"), enquanto a resposta traz a definicao. A regra antiga -- "a
 * palavra mais longa da alternativa correta" -- por isso escolhia ORDENADOS
 * em vez de ALGORITMO, e degenerava em lixo (OROU) quando a resposta era curta.
 *
 * Garante: 4..MAX_WORD_LEN letras, apenas A-Z, sem acento e NUNCA cortada no
 * meio (o caso "RESPONSABILIDAD"). Devolve '' quando o texto nao oferece
 * nenhum candidato aceitavel -- a tela de revisao sinaliza e o instrutor digita.
 */
/**
 * @param {string} answerText
 * @param {string} [questionText]
 * @param {Set<string>} [taken]
 * @returns {string} palavra de 4..MAX_WORD_LEN letras A-Z, ou '' quando nao ha candidato
 */
export function extractKeyword(answerText, questionText, taken) {
  const used = taken || new Set();
  const ranked = scoreCandidates(answerText, questionText || '', used);
  if (ranked.length > 0) return ranked[0];

  // Nada na faixa ideal: aceita palavras de 3 letras antes de desistir.
  const short = [...tokenize(answerText), ...tokenize(questionText || '')]
    .filter((w) => (
      /^[A-Z]+$/.test(w) && w.length >= 3 && w.length <= MAX_WORD_LEN && !STOP_WORDS.has(w)
    ))
    .sort((a, b) => b.length - a.length);

  return short.length > 0 ? short[0] : '';
}

/**
 * Aplica extractKeyword a uma lista inteira de questoes com deduplicacao
 * global: cada questao recebe a melhor palavra que outra ainda nao levou.
 * Devolve uma nova lista; nao muta a original.
 */
/**
 * @param {import('../types.js').Question[]} questions
 * @returns {import('../types.js').Question[]}
 */
export function assignKeywords(questions) {
  const taken = new Set();

  return questions.map((q) => {
    // Respeita uma palavra que ja veio boa (ex.: "Palavra:" de um TXT).
    const existing = sanitizeWord(q.word).slice(0, MAX_WORD_LEN);
    if (existing.length >= MIN_WORD_LEN && !taken.has(existing)) {
      taken.add(existing);
      return { ...q, word: existing };
    }

    const answerText = q.correct >= 0 && q.options[q.correct]
      ? stripOptionPrefix(q.options[q.correct])
      : q.options.map(stripOptionPrefix).join(' ');

    const word = extractKeyword(answerText, q.q, taken);
    if (word) taken.add(word);
    return { ...q, word };
  });
}
