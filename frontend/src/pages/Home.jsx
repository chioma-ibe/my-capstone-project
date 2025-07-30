import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Spinner from '../components/spinner/Spinner';
import StarRating from '../components/StarRating';
import '../styles/pages/Home.css';
import { motion, useAnimation } from 'framer-motion';

function Home() {
  const { dbUser } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [matchRequests, setMatchRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const fetchData = async () => {
      if (!dbUser?.id) return;

      try {
        setLoading(true);
        setError('');

        const [matches, requests] = await Promise.all([
          apiService.getPotentialMatches(dbUser.id),
          apiService.getMatchRequests(dbUser.id)
        ]);

        setPotentialMatches(matches);
        setMatchRequests(requests);
        setCurrentUserIndex(0);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dbUser]);

  if (loading) {
    return (
      <div className="home-container">
        <div className="page-loading">
          <Spinner />
        </div>
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

      if (currentPotentialMatch.hasPendingRequest) {
        if (matchRequests && matchRequests.length > 0) {
          const matchRequest = matchRequests.find(
            request => request.sender.id === currentPotentialMatch.id
          );

          if (matchRequest) {
            await apiService.respondToMatchRequest(matchRequest.id, 'ACCEPTED');
          } else {
            throw new Error('Match request not found');
          }
        } else {
          throw new Error('Match requests data missing');
        }
      } else {
        await apiService.createMatchRequest(dbUser.id, currentPotentialMatch.id);
      }

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
      setError('Failed to process match');
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

            <div className="user-rating">
              {currentPotentialMatch.averageRating > 0 ? (
                <StarRating
                  rating={currentPotentialMatch.averageRating}
                  totalRatings={currentPotentialMatch.totalRatings}
                />
              ) : (
                <span className="no-rating">No ratings yet</span>
              )}
            </div>

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
              className={`match-button ${currentPotentialMatch.hasPendingRequest ? 'accept-button' : ''}`}
              onClick={handleMatch}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Processing...'
                : currentPotentialMatch.hasPendingRequest
                  ? 'Accept Match'
                  : 'Match'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
