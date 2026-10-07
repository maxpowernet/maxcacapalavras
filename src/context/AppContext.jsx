import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { store } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [classes,   setClasses]   = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [games,     setGames]     = useState([]);
  const [history,   setHistory]   = useState([]);
  const [questions, setQuestions] = useState([]);
  const [gameState, setGameState] = useState(
    /** @type {import('../types.js').GameState} */ ({ status: 'idle' })
  );

  const ODDS_DEFAULTS = { cassino: 20, crash: 10, lootbox: 5, roleta: 45, cassino_inst: 20 };
  const [odds, setOddsState] = useState(ODDS_DEFAULTS);

  const themeHook = useTheme();

  // Create refs for gameState so onSnapshot listeners don't use stale values
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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

    // Migração de perguntas: viram um banco pessoal reutilizável. A coleção
    // 'questions' antiga não era lida por ninguém.
    if (localQuestions.length > 0) {
      const bankId = `migracao-${userId}`;
      await setDoc(doc(db, 'questionBanks', bankId), {
        id: bankId,
        name: 'Perguntas importadas (migração)',
        questions: localQuestions,
        isPublic: false,
        ownerId: userId,
        ownerName: '',
        createdAt: Date.now(),
      });
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

  const resetUserData = () => {
    setClasses([]);
    setGames([]);
    setHistory([]);
    setQuestions([]);
    setQuestionBanks([]);
    setGameState({ status: 'idle' });
    setOddsState({ cassino: 20, crash: 10, lootbox: 5, roleta: 45, cassino_inst: 20 });
  };

  // Persiste o estado da partida sempre que ele muda. O guarda evita
  // reescrever exatamente o que acabou de chegar do snapshot do Firestore.
  const lastPersistedRef = useRef(null);
  useEffect(() => {
    if (!user || !gameState) return;
    const snapshot = JSON.stringify(gameState);
    if (lastPersistedRef.current === snapshot) return;
    lastPersistedRef.current = snapshot;
    setDoc(doc(db, 'users', user.userId, 'state', 'game_state'), gameState)
      .catch(err => console.error('Erro ao salvar game_state:', err));
  }, [gameState, user]);

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
          // try/finally: antes, uma falha na migração (offline, regras do
          // Firestore, cota) escapava do await e o setAuthLoading(false) do
          // fim nunca rodava — o app ficava preso em "Carregando..." para
          // sempre, sem nenhuma mensagem.
          try {
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
          } catch (err) {
            console.error('Falha ao carregar/migrar o perfil:', err);
          } finally {
            setAuthLoading(false);
          }
        });
      } else {
        setUser(null);
        resetUserData();
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);


  // 2. Listen to Firestore collections when user is logged in
  useEffect(() => {
    if (!user) return;

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

    // Recupera as perguntas da partida a partir do documento do jogo.
    let loadedGames = [];
    const hydrateQuestions = (state) => {
      if (!state || state.status !== 'playing' || !state.gameId) return;
      const game = loadedGames.find((g) => g.id === state.gameId);
      if (game?.questions?.length) setQuestions(game.questions);
    };

    const unsubscribeGames = onSnapshot(qGames, (snapshot) => {
      loadedGames = snapshot.docs.map((d) => d.data());
      setGames(loadedGames);
      hydrateQuestions(gameStateRef.current);
    });

    // Listen to history
    const qHistory = query(collection(db, 'history'), where('createdBy', '==', userId));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      list.sort((a, b) => b.date - a.date);
      setHistory(list);
    });

    // Bancos de perguntas: os próprios e os publicados por outros instrutores.
    const qMyBanks = query(collection(db, 'questionBanks'), where('ownerId', '==', userId));
    const qPublicBanks = query(collection(db, 'questionBanks'), where('isPublic', '==', true));

    let mine = [];
    let shared = [];
    const mergeBanks = () => {
      const byId = new Map();
      for (const b of [...mine, ...shared]) byId.set(b.id, b);
      setQuestionBanks([...byId.values()]);
    };
    const unsubscribeMyBanks = onSnapshot(qMyBanks, (snap) => {
      mine = snap.docs.map((d) => d.data());
      mergeBanks();
    });
    const unsubscribePublicBanks = onSnapshot(qPublicBanks, (snap) => {
      shared = snap.docs.map((d) => d.data());
      mergeBanks();
    });

    // Listen to gameState
    const gameStateDocRef = doc(db, 'users', userId, 'state', 'game_state');
    const unsubscribeGameState = onSnapshot(gameStateDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const state = /** @type {import('../types.js').GameState} */ (docSnap.data());
        setGameState(state);
        hydrateQuestions(state);
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
      unsubscribeMyBanks();
      unsubscribePublicBanks();
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
  const setGameStateWithFirebase = (updater) => {
    if (!user) return;
    setGameState(updater);
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      authLoading,
      classes, setClasses,
      questionBanks, setQuestionBanks,
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
