import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup } from '../firebase/firebase';
import apiService from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [googleToken, setGoogleToken] = useState(() => {
    return localStorage.getItem('googleToken') || null;
  });

  async function registerUser(email, password) {
    try {
      setAuthError('');
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  async function signInUser(email, password) {
    try {
      setAuthError('');
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      setAuthError('');
      const result = await signInWithPopup(auth, googleProvider);

      const credential = GoogleAuthProvider.credentialFromResult(result);

      const token = credential?.accessToken || null;

      if (token) {
        localStorage.setItem('googleToken', token);
      }

      setGoogleToken(token);

      return result;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  async function signOutUser() {
    try {
      setAuthError('');
      localStorage.removeItem('googleToken');
      setGoogleToken(null);
      return await signOut(auth);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const backendUser = await apiService.authenticateUser(
            user.uid,
            user.email,
            user.displayName
          );
          setUser(user);
          setDbUser(backendUser.user);
        } catch (error) {
          setUser(user);
          setDbUser(null);
        }
      } else {
        setUser(null);
        setDbUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  const contextValue = {
    currentUser: user,
    dbUser: dbUser,
    loading: isLoading,
    login: signInUser,
    signup: registerUser,
    logout: signOutUser,
    signInWithGoogle,
    authError,
    setAuthError,
    googleToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
