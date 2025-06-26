import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import './styles/app.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/matches" element={<Matches />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Study Buddy App - Find study partners based on shared courses</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
