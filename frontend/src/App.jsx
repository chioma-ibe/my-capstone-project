import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FirebaseAuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Calendar from './pages/Calendar';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import PrivateRoute from './components/auth/PrivateRoute';
import './styles/app.css';

function App() {
  return (
    <Router>
      <FirebaseAuthProvider>
        <div className="app-container">
          <Navbar />

          <main className="app-main">
            <Routes>
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/matches"
                element={
                  <PrivateRoute>
                    <Matches />
                  </PrivateRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <PrivateRoute>
                    <Calendar />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>Study Buddy Matcher </p>
          </footer>
        </div>
      </FirebaseAuthProvider>
    </Router>
  );
}

export default App;
