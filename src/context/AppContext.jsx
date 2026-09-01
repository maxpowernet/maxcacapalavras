import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { store } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [classes,   setClasses]   = useState([]);
  const [games,     setGames]     = useState([]);
  const [history,   setHistory]   = useState([]);
  const [questions, setQuestions] = useState([]);
  const [gameState, setGameState] = useState({ status: 'idle' });

  const ODDS_DEFAULTS = { cassino: 20, crash: 10, lootbox: 5, roleta: 45, cassino_inst: 20 };
  const [odds, setOddsState] = useState(ODDS_DEFAULTS);

  const themeHook = useTheme();

  // Create refs for gameState so onSnapshot listeners don't use stale values
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    let unsubUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        // Escuta o perfil do usuário em tempo real
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubUserDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data();
            setUser(profile);
            
            // Tenta migrar os dados locais se houver
            await checkAndMigrateLocalStorage(profile.userId);
          } else {
            // Caso o doc de perfil ainda não exista (durante o registro)
            setUser({
              userId: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email,
              email: firebaseUser.email,
              role: 'instructor'
            });
          }
          setAuthLoading(false);
        });
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Função auxiliar para migrar dados de localStorage para Firestore
  const checkAndMigrateLocalStorage = async (userId) => {
    const localClasses = store.get('classes') || [];
    const localGames = store.get('games') || [];
    const localHistory = store.get('history') || [];
    const localQuestions = store.get('questions') || [];
    const localGameState = store.get('game_state');

    const migratedKey = `migrated_${userId}`;
    if (store.get(migratedKey)) return; // Já migrou

    let writesOccurred = false;

    // Migração de turmas
    if (localClasses.length > 0) {
      for (const cls of localClasses) {
        await setDoc(doc(db, 'classes', cls.id), { ...cls, createdBy: userId });
      }
      writesOccurred = true;
    }

    // Migração de jogos
    if (localGames.length > 0) {
      for (const game of localGames) {
        await setDoc(doc(db, 'games', game.id), { ...game, createdBy: userId });
      }
      writesOccurred = true;
    }

    // Migração de histórico
    if (localHistory.length > 0) {
      for (const hist of localHistory) {
        await setDoc(doc(db, 'history', hist.id), { ...hist, createdBy: userId });
      }
      writesOccurred = true;
    }

    // Migração de perguntas
    if (localQuestions.length > 0) {
      for (const q of localQuestions) {
        await setDoc(doc(db, 'questions', q.id), { ...q, createdBy: userId });
      }
      writesOccurred = true;
    }

    // Migração do estado de jogo ativo
    if (localGameState && localGameState.status === 'playing') {
      await setDoc(doc(db, 'users', userId, 'state', 'game_state'), localGameState);
    }

    if (writesOccurred) {
      // Marcar como migrado no localStorage e limpar itens locais obsoletos
      store.set(migratedKey, true);
      store.remove('classes');
      store.remove('games');
      store.remove('history');
      store.remove('questions');
      store.remove('game_state');
    }
  };

  // 2. Listen to Firestore collections when user is logged in
  useEffect(() => {
    if (!user) {
      setClasses([]);
      setGames([]);
      setHistory([]);
      setQuestions([]);
      setGameState({ status: 'idle' });
      setOddsState({ cassino: 20, crash: 10, lootbox: 5, roleta: 45, cassino_inst: 20 });
      return;
    }

    const userId = user.userId;

    // Listen to classes
    const qClasses = query(collection(db, 'classes'), where('createdBy', '==', userId));
    const unsubscribeClasses = onSnapshot(qClasses, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      setClasses(list);
    });

    // Listen to games
    const qGames = query(collection(db, 'games'), where('createdBy', '==', userId));
    const unsubscribeGames = onSnapshot(qGames, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      setGames(list);
    });

    // Listen to history
    const qHistory = query(collection(db, 'history'), where('createdBy', '==', userId));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      list.sort((a, b) => b.date - a.date);
      setHistory(list);
    });

    // Listen to questions
    const qQuestions = query(collection(db, 'questions'), where('createdBy', '==', userId));
    const unsubscribeQuestions = onSnapshot(qQuestions, (snapshot) => {
      if (gameStateRef.current && gameStateRef.current.status === 'playing') {
        // Ignora atualizações do banco de perguntas durante o jogo ativo
        // para não sobrescrever as perguntas do jogo atual
        return;
      }
      const list = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      setQuestions(list);
    });

    // Listen to gameState
    const gameStateDocRef = doc(db, 'users', userId, 'state', 'game_state');
    const unsubscribeGameState = onSnapshot(gameStateDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data());
      } else {
        setGameState({ status: 'idle' });
      }
    });

    // Listen to bets odds
    const oddsDocRef = doc(db, 'users', userId, 'state', 'odds');
    const unsubscribeOdds = onSnapshot(oddsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setOddsState(prev => ({ ...prev, ...docSnap.data() }));
      }
    });

    return () => {
      unsubscribeClasses();
      unsubscribeGames();
      unsubscribeHistory();
      unsubscribeQuestions();
      unsubscribeGameState();
      unsubscribeOdds();
    };
  }, [user]);

  const setOdd = (game, value) => {
    if (!user) return;
    const clamped = Math.max(0, Math.min(99, Number(value)));
    setOddsState(prev => {
      const next = { ...prev, [game]: clamped };
      setDoc(doc(db, 'users', user.userId, 'state', 'odds'), next)
        .catch(err => console.error('Erro ao salvar odds:', err));
      return next;
    });
  };

  // Sync gameState back to Firestore when it is mutated locally by useGame.js
  const setGameStateWithFirebase = async (updater) => {
    if (!user) return;
    
    setGameState(prev => {
      const nextState = typeof updater === 'function' ? updater(prev) : updater;
      // Write to Firestore
      const gameStateDocRef = doc(db, 'users', user.userId, 'state', 'game_state');
      setDoc(gameStateDocRef, nextState).catch(err => console.error("Erro ao salvar game_state:", err));
      return nextState;
    });
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      authLoading,
      classes, setClasses,
      games, setGames,
      history, setHistory,
      questions, setQuestions,
      gameState, setGameState: setGameStateWithFirebase,
      odds, setOdd,
      ...themeHook
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  return useContext(AppContext);
}
