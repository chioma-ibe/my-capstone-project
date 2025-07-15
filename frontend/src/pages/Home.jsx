import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../styles/pages/Home.css';
import { motion, useAnimation } from 'framer-motion';

function Home() {
  const { dbUser } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const controls = useAnimation();

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

      await controls.start({
        x: 300,
        rotate: 30,
        opacity: 0,
        transition: { duration: 0.3 }
      });

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

      controls.set({ x: 0, rotate: 0, opacity: 1 });
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Failed to create match');
      controls.set({ x: 0, rotate: 0, opacity: 1 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!currentPotentialMatch || actionLoading) return;

    try {
      setActionLoading(true);

      await controls.start({
        x: -300,
        rotate: -30,
        opacity: 0,
        transition: { duration: 0.3 }
      });

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

      // Reset card position for next card
      controls.set({ x: 0, rotate: 0, opacity: 1 });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h1>Find Study Buddies</h1>
      <p className="home-description">
        Match with other students taking the same courses as you!
      </p>

      <div className="single-user-container">
        <motion.div
          className="user-card"
          animate={controls}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            const threshold = 100;
            if (info.offset.x > threshold) {
              handleMatch();
            } else if (info.offset.x < -threshold) {
              handleSkip();
            } else {
              controls.start({
                x: 0,
                rotate: 0,
                transition: { type: "spring", stiffness: 500, damping: 30 }
              });
            }
          }}
          onDrag={(_, info) => {
            const rotation = info.offset.x * 0.1;
            controls.set({
              x: info.offset.x,
              rotate: rotation
            });
          }}
          whileDrag={{ scale: 1.05 }}
          style={{ cursor: 'grab' }}
        >
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
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
