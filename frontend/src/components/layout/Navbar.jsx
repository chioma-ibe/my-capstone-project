import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';
import '../../styles/components/layout/Navbar.css';

function Navbar() {
  const { currentUser, logout, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setAuthError('OOPS! log out fialed');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          StudyBuddy
        </Link>

        {currentUser && (
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                Profile
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/matches" className={`nav-link ${location.pathname === '/matches' ? 'active' : ''}`}>
                Matches
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/calendar" className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}>
                Calendar
              </Link>
            </li>
          </ul>
        )}

        <div className="navbar-right">
          <ThemeToggle />
          <div className="auth-links">
            {currentUser ? (
              <div className="user-info">
                <img
                  src={currentUser.photoURL || "https://static.xx.fbcdn.net/rsrc.php/v1/yi/r/odA9sNLrE86.jpg"}
                  alt="Profile"
                  className="profile-photo"
                />
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/signup" className="nav-link">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
