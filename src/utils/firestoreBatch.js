import { writeBatch } from 'firebase/firestore';

// O Firestore aceita no maximo 500 operacoes por batch. As rotinas de importar
// e de limpar nao fatiavam nada, entao um banco grande fazia o commit() estourar.
const MAX_BATCH_OPS = 500;

/**
 * Executa `apply(batch, item)` para cada item, commitando a cada 500 operacoes.
 */
export async function runBatched(db, items, apply) {
  let batch = writeBatch(db);
  let ops = 0;

  for (const item of items) {
    apply(batch, item);
    ops++;
    if (ops >= MAX_BATCH_OPS) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
}
