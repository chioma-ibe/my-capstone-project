import { useState } from 'react';
import apiService from '../services/api';
import '../styles/components/RatingModal.css';

function RatingModal({ isOpen, onClose, partner, currentUserId, onRatingSubmitted }) {
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiService.createRating(currentUserId, partner.id, parseInt(rating));
      if (onRatingSubmitted) {
        onRatingSubmitted(partner.id);
      }
      onClose();
      setRating('');
    } catch (err) {
      setError('Failed to submit rating');
      console.error('Error submitting rating:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rating-modal-overlay" onClick={handleOverlayClick}>
      <div className="rating-modal">
        <div className="rating-modal-header">
          <h3>Rate {partner.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="rating-form">
          <div className="rating-field">
            <label htmlFor="rating">Rating:</label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
            >
              <option value="">Select Rating</option>
              <option value="1">⭐ (1 star)</option>
              <option value="2">⭐⭐ (2 stars)</option>
              <option value="3">⭐⭐⭐ (3 stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 stars)</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="rating-modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !rating}>
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RatingModal;
