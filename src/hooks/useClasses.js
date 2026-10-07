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
      createdBy: user.userId,
      students: [],
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

  // Alunos ficam embutidos no documento da turma: turmas sao pequenas e assim
  // nao e preciso uma colecao nova nem regras novas no Firestore.
  const setStudents = async (id, students) => {
    await updateDoc(doc(db, 'classes', id), { students });
  };

  return { classes, addClass, removeClass, updateClass, setStudents };
}
