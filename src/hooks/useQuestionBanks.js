import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bancos de perguntas reutilizaveis.
 *
 * Substitui a colecao `questions`, que era escrita mas nunca lida por ninguem
 * e cujo listener ainda sobrescrevia as perguntas da partida em andamento.
 * Um banco publico pode ser lido e copiado por qualquer instrutor; editar e
 * apagar continuam sendo so do dono.
 */
export function useQuestionBanks() {
  const { questionBanks, user } = useAppContext();

  const myBanks = questionBanks.filter((b) => b.ownerId === user?.userId);
  const publicBanks = questionBanks.filter((b) => b.isPublic && b.ownerId !== user?.userId);

  const publishBank = async ({ name, questions, isPublic = true }) => {
    if (!user) throw new Error('Usuário não autenticado.');
    const bank = {
      id: uuidv4(),
      name,
      questions,
      isPublic,
      ownerId: user.userId,
      ownerName: user.name || user.email || 'Instrutor',
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'questionBanks', bank.id), bank);
    return bank;
  };

  const updateBank = async (id, data) => {
    await updateDoc(doc(db, 'questionBanks', id), data);
  };

  const removeBank = async (id) => {
    await deleteDoc(doc(db, 'questionBanks', id));
  };

  return { questionBanks, myBanks, publicBanks, publishBank, updateBank, removeBank };
}
