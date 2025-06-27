import { Link } from 'react-router-dom';
import '../../styles/components/layout/Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          StudyBuddy
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/matches" className="nav-link">
              Matches
            </Link>
          </li>
        </ul>
        <div className="auth-links">
          <Link to="/login" className="nav-link">
            Login
          </Link>
          <Link to="/signup" className="nav-link">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
