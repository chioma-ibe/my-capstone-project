import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import apiService from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

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

  async function signOutUser() {
    try {
      setAuthError('');
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
          await apiService.authenticateUser(
            user.uid,
            user.email,
            user.displayName
          );
          setUser(user);
        } catch (error) {
          console.error('Failed to authenticate user with backend:', error);
          setUser(user); 
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  const contextValue = {
    currentUser: user,
    loading: isLoading,
    login: signInUser,
    signup: registerUser,
    logout: signOutUser,
    authError,
    setAuthError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
