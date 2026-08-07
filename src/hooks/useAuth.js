import { useAppContext } from '../context/AppContext';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, limit } from 'firebase/firestore';

export function useAuth() {
  const { user, setUser } = useAppContext();

  const getFriendlyErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/weak-password':
        return 'A senha precisa ter no mínimo 6 caracteres.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      default:
        return 'Ocorreu um erro ao processar. Tente novamente.';
    }
  };

  const register = async (name, email, password) => {
    try {
      // 1. Cria o usuário no Firebase Auth primeiro
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Agora autenticado, verifica se é o primeiro usuário (vira instrutor)
      const usersQuery = query(collection(db, 'users'), limit(1));
      const usersSnap = await getDocs(usersQuery);
      const role = usersSnap.empty ? 'instructor' : 'student';

      // 3. Salva o perfil no Firestore
      const profile = {
        userId: firebaseUser.uid,
        name,
        email,
        role,
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), profile);

      setUser(profile);
      return profile;
    } catch (err) {
      console.error(err);
      throw new Error(getFriendlyErrorMessage(err.code) || err.message);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      console.error(err);
      throw new Error(getFriendlyErrorMessage(err.code) || err.message);
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      console.error(err);
      throw new Error(getFriendlyErrorMessage(err.code) || err.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return { user, register, login, logout, resetPassword };
}
