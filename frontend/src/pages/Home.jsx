import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../styles/pages/Home.css';

function Home() {
  const { dbUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  useEffect(() => {
    const fetchPotentialMatches = async () => {
      if (!dbUser?.id) return;

      try {
        setLoading(true);
        setError('');
        const matches = await apiService.getPotentialMatches(dbUser.id);
        setUsers(matches);
        setCurrentUserIndex(0);
      } catch (err) {
        console.error('Error fetching potential matches:', err);
        setError('Failed to load potential matches');
      } finally {
        setLoading(false);
      }
    };

    fetchPotentialMatches();
  }, [dbUser]);

  if (loading) {
    return (
      <div className="home-container">
        <div>Loading potential matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div>Error: {error}</div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="home-container">
        <div>Please log in to find study buddies.</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="home-container">
        <h1>Find Study Buddies</h1>
        <div className="no-matches">
          <p>No potential matches found. Try adding more courses to your profile!</p>
        </div>
      </div>
    );
  }

  const currentUser = users[currentUserIndex];

  const handleMatch = () => {
    goToNextUser();
  };

  const handleSkip = () => {
    goToNextUser();
  };

  const goToNextUser = () => {
    setCurrentUserIndex((prevIndex) => {
      if (prevIndex >= users.length - 1) {
        return 0;
      } else {
        return prevIndex + 1;
      }
    });
  };

  return (
    <div className="home-container">
      <h1>Find Study Buddies</h1>
      <p className="home-description">
        Match with other students taking the same courses as you!
      </p>

      <div className="single-user-container">
        <div className="user-card">
          <div className="user-info">
            <h2>{currentUser.name}</h2>
            <p className="user-bio">{currentUser.bio}</p>
            <div className="user-courses">
              <h3>Shared Courses:</h3>
              <ul>
                {currentUser.sharedCourses.map((course) => (
                  <li key={course.id}>
                    {course.name} (Proficiency: {course.proficiency})
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card-actions">
            <button
              className="skip-button"
              onClick={handleSkip}
            >
              Skip
            </button>
            <button
              className="match-button"
              onClick={handleMatch}
            >
              Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
