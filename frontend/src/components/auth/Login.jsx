import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/components/auth/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
        <div className="auth-links">
          <div>
            Need an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
