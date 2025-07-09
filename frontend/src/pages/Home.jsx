import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../styles/pages/Home.css';

function Home() {
  const { dbUser } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchPotentialMatches = async () => {
      if (!dbUser?.id) return;

      try {
        setLoading(true);
        setError('');
        const matches = await apiService.getPotentialMatches(dbUser.id);
        setPotentialMatches(matches);
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

  if (potentialMatches.length === 0) {
    return (
      <div className="home-container">
        <h1>Find Study Buddies</h1>
        <div className="no-matches">
          <p>No potential matches found. Try adding more courses to your profile!</p>
        </div>
      </div>
    );
  }

  const currentPotentialMatch = potentialMatches[currentUserIndex];

  const handleMatch = async () => {
    if (!currentPotentialMatch || actionLoading) return;

    try {
      setActionLoading(true);
      await apiService.createMatch(dbUser.id, currentPotentialMatch.id);

      setPotentialMatches(prevMatches => {
        const newMatches = prevMatches.filter(user => user.id !== currentPotentialMatch.id);
        return newMatches;
      });

      setCurrentUserIndex(prevIndex => {
        if (prevIndex >= potentialMatches.length - 1) {
          return 0;
        }
        return prevIndex;
      });
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Failed to create match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = () => {
    if (!currentPotentialMatch) return;

    setPotentialMatches(prevMatches => {
      const newMatches = prevMatches.filter(user => user.id !== currentPotentialMatch.id);
      return newMatches;
    });

    setCurrentUserIndex(prevIndex => {
      if (prevIndex >= potentialMatches.length - 1) {
        return 0;
      }
      return prevIndex;
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
            <h2>{currentPotentialMatch.name}</h2>
            <p className="user-bio">{currentPotentialMatch.bio}</p>

            <p className="user-rating">
              Rating: {currentPotentialMatch.averageRating > 0
                ? `${currentPotentialMatch.averageRating}/5.0 (${currentPotentialMatch.totalRatings} reviews)`
                : 'No ratings yet'
              }
            </p>

            <div className="user-courses">
              <h3>Shared Courses:</h3>
              <ul>
                {currentPotentialMatch.sharedCourses.map((course) => (
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
              disabled={actionLoading}
            >
              {actionLoading ? 'Skipping...' : 'Skip'}
            </button>
            <button
              className="match-button"
              onClick={handleMatch}
              disabled={actionLoading}
            >
              {actionLoading ? 'Matching...' : 'Match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
