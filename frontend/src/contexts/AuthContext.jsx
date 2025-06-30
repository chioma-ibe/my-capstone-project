import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  async function registerUser(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async function signInUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signOutUser() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  const contextValue = {
    user,
    registerUser,
    signInUser,
    signOutUser,
    authError,
    setAuthError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
