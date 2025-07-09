import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import RatingModal from '../components/RatingModal';
import '../styles/pages/Matches.css';

function Matches() {
  const { dbUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [matchRatings, setMatchRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  useEffect(() => {
    const fetchMatchesAndRatings = async () => {
      if (!dbUser?.id) return;

      try {
        setLoading(true);
        setError(null);
        const matchesData = await apiService.getConfirmedMatches(dbUser.id);
        setMatches(matchesData);

        const ratingsData = {};
        const userRatingsData = {};

        for (const match of matchesData) {
          try {
            const ratingInfo = await apiService.getUserRatings(match.id);
            ratingsData[match.id] = ratingInfo;

            try {
              const existingRating = await apiService.getSpecificRating(dbUser.id, match.id);
              userRatingsData[match.id] = existingRating;
            } catch (err) {
              userRatingsData[match.id] = null;
            }
          } catch (err) {
            ratingsData[match.id] = { averageScore: 0, totalRatings: 0 };
            userRatingsData[match.id] = null;
          }
        }
        setMatchRatings(ratingsData);
        setUserRatings(userRatingsData);
      } catch (err) {
        setError('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchesAndRatings();
  }, [dbUser?.id]);

  const handleRatePartner = (partner) => {
    setSelectedPartner(partner);
    setRatingModalOpen(true);
  };

  const handleCloseRatingModal = () => {
    setRatingModalOpen(false);
    setSelectedPartner(null);
  };

  const handleRatingSubmitted = async (partnerId) => {
    try {
      const ratingInfo = await apiService.getUserRatings(partnerId);
      setMatchRatings(prev => ({
        ...prev,
        [partnerId]: ratingInfo
      }));

      try {
        const existingRating = await apiService.getSpecificRating(dbUser.id, partnerId);
        setUserRatings(prev => ({
          ...prev,
          [partnerId]: existingRating
        }));
      } catch (err) {
        setUserRatings(prev => ({
          ...prev,
          [partnerId]: null
        }));
      }
    } catch (err) {
    }
  };

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
                {matchRatings[match.id] && (
                  <div className="match-rating">
                    {matchRatings[match.id].averageScore > 0 ? (
                      <span className="rating-display">
                        ⭐ {matchRatings[match.id].averageScore} ({matchRatings[match.id].totalRatings} reviews)
                      </span>
                    ) : (
                      <span className="no-rating">No ratings yet</span>
                    )}
                  </div>
                )}
              </div>
              <div className="match-actions">
                <button className="schedule-btn">Schedule Study Session</button>
                <button className="rate-btn" onClick={() => handleRatePartner(match)}>
                  {userRatings[match.id] ? 'Update Rating' : 'Rate Study Partner'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RatingModal
        isOpen={ratingModalOpen}
        onClose={handleCloseRatingModal}
        partner={selectedPartner}
        currentUserId={dbUser?.id}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </div>
  );
}

export default Matches;
