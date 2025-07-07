import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../styles/pages/Matches.css';

function Matches() {
  const { dbUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!dbUser?.id) return;

      try {
        setLoading(true);
        setError(null);
        const matchesData = await apiService.getPotentialMatches(dbUser.id);
        setMatches(matchesData);
      } catch (err) {
        setError('Failed to load matches');
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [dbUser?.id]);

  if (!dbUser) {
    return <div>Please log in to view your matches.</div>;
  }

  if (loading) {
    return <div>Loading matches...</div>;
  }

  if (error) {
    return <div className="error-message" style={{color: 'red'}}>{error}</div>;
  }

  return (
    <div className="matches-container">
      <h1>Your Matches</h1>
      <p className="matches-description">
        Connect with your study buddies and schedule study sessions!
      </p>

      {matches.length === 0 ? (
        <div className="no-matches">
          <p>You don't have any matches yet. Add some courses to find study buddies!</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-info">
                <h2>{match.name}</h2>
                <p className="match-email">{match.email}</p>
                {match.bio && <p className="match-bio">{match.bio}</p>}
                <p className="match-date">Matched on {match.matchedAt}</p>
                <div className="match-courses">
                  <h3>Shared Courses:</h3>
                  <ul>
                    {match.sharedCourses.map((course) => (
                      <li key={course.id} className="shared-course">
                        <span className="course-name">{course.name}</span>
                        <div className="proficiency-levels">
                          <span className="proficiency-label">Your level: {course.userProficiency}</span>
                          <span className="proficiency-label">Their level: {course.matchProficiency}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="match-actions">
                <button className="schedule-btn">Schedule Study Session</button>
                <button className="rate-btn">Rate Study Partner</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Matches;
