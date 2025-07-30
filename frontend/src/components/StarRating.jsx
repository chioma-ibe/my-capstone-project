import '../styles/components/StarRating.css';

const StarRating = ({ rating, totalRatings, showCount = true }) => {
  const normalizedRating = Math.min(Math.max(parseFloat(rating) || 0, 0), 5);

  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="star-rating">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="star full-star">★</span>
      ))}

      {hasHalfStar && <span className="star half-star">★</span>}

      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="star empty-star">★</span>
      ))}

      {showCount && totalRatings !== undefined && (
        <span className="rating-count">({totalRatings})</span>
      )}
    </div>
  );
};

export default StarRating;
