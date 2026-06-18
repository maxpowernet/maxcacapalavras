import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export function useGames() {
  const { games, user } = useAppContext();

  const addGame = async (gameData) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const newGame = { 
      id: uuidv4(), 
      createdAt: Date.now(),
      createdBy: user.userId,
      ...gameData 
    };
    await setDoc(doc(db, 'games', newGame.id), newGame);
    return newGame;
  };

  const removeGame = async (id) => {
    await deleteDoc(doc(db, 'games', id));
  };

  const updateGame = async (id, updatedData) => {
    await updateDoc(doc(db, 'games', id), updatedData);
  };

  const getGamesByClass = (classId) => {
    return games.filter(g => g.classId === classId);
  };

  return { games, addGame, removeGame, updateGame, getGamesByClass };
}
