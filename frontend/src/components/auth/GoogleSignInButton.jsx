import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/auth/Auth.css';

function GoogleSignInButton() {
  const { signInWithGoogle, setAuthError } = useAuth();
  const navigate = useNavigate();

  async function handleGoogleSignIn() {
    try {
      setAuthError('');
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
    }
  }

  return (
    <button
      type="button"
      className="btn btn-google"
      onClick={handleGoogleSignIn}
    >
      Sign in with Google
    </button>
  );
}

export default GoogleSignInButton;
