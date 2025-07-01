import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        marginTop: '50px'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        marginTop: '50px'
      }}>
        <h3>OOPS! Sign in to view</h3>
        <p>
          <Link to="/login">Sign in here</Link>
        </p>
      </div>
    );
  }

  return children;
}

export default PrivateRoute;
