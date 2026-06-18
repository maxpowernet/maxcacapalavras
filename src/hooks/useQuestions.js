import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export function useQuestions() {
  const { questions, user } = useAppContext();

  const addQuestions = async (newQuestions) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const batch = writeBatch(db);
    for (const q of newQuestions) {
      const qId = q.id || uuidv4();
      const docRef = doc(db, 'questions', qId);
      batch.set(docRef, {
        ...q,
        id: qId,
        createdBy: user.userId,
        createdAt: Date.now()
      });
    }
    await batch.commit();
  };

  const removeQuestion = async (id) => {
    await deleteDoc(doc(db, 'questions', id));
  };

  const updateQuestion = async (id, updatedData) => {
    await updateDoc(doc(db, 'questions', id), updatedData);
  };

  const clearQuestions = async () => {
    if (!user) throw new Error("Usuário não autenticado.");
    const q = query(collection(db, 'questions'), where('createdBy', '==', user.userId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  };

  return {
    questions,
    addQuestions,
    removeQuestion,
    updateQuestion,
    clearQuestions
  };
}
