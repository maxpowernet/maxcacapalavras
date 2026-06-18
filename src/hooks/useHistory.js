import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { doc, setDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export function useHistory() {
  const { history, user } = useAppContext();

  const addHistoryRecord = async (recordData) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const newRecord = { 
      id: uuidv4(), 
      date: Date.now(),
      createdBy: user.userId,
      ...recordData 
    };
    await setDoc(doc(db, 'history', newRecord.id), newRecord);
    return newRecord;
  };

  const clearHistory = async () => {
    if (!user) throw new Error("Usuário não autenticado.");
    const q = query(collection(db, 'history'), where('createdBy', '==', user.userId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  };

  return { history, addHistoryRecord, clearHistory };
}
