import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export function useClasses() {
  const { classes, user } = useAppContext();

  const addClass = async (name) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const newClass = { 
      id: uuidv4(), 
      name, 
      createdAt: Date.now(),
      createdBy: user.userId 
    };
    await setDoc(doc(db, 'classes', newClass.id), newClass);
    return newClass;
  };

  const removeClass = async (id) => {
    await deleteDoc(doc(db, 'classes', id));
  };

  const updateClass = async (id, name) => {
    await updateDoc(doc(db, 'classes', id), { name });
  };

  return { classes, addClass, removeClass, updateClass };
}
