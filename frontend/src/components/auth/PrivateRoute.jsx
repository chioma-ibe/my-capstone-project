import { Link } from 'react-router-dom';

function PrivateRoute() {
  // Always show the "sign in" message since we have no auth
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

export default PrivateRoute;
