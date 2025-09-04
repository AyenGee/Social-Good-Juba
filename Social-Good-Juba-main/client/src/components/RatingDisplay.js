import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RatingDisplay.css';

const RatingDisplay = ({ userId, showDetails = false, className = '' }) => {
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchRating();
    }
  }, [userId]);

  const fetchRating = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/ratings/user/${userId}`);
      setRatingData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching rating:', err);
      setError('Failed to load rating');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={`rating-display loading ${className}`}>Loading...</div>;
  }

  if (error) {
    return <div className={`rating-display error ${className}`}>Rating unavailable</div>;
  }

  if (!ratingData || ratingData.totalReviews === 0) {
    return (
      <div className={`rating-display no-reviews ${className}`}>
        <span className="no-rating">No reviews yet</span>
      </div>
    );
  }

  // Ensure rating is a valid number
  const averageRating = typeof ratingData.averageRating === 'number' && !isNaN(ratingData.averageRating) 
    ? ratingData.averageRating 
    : 0;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">★</span>);
    }
    
    return stars;
  };

  return (
    <div className={`rating-display ${className}`}>
      <div className="rating-stars">
        {renderStars(averageRating)}
      </div>
      <div className="rating-info">
        <span className="rating-value">{averageRating.toFixed(1)}</span>
        <span className="rating-count">({ratingData.totalReviews} reviews)</span>
      </div>
      
      {showDetails && ratingData.ratings && (
        <div className="rating-breakdown">
          {Object.entries(ratingData.ratings).reverse().map(([stars, count]) => (
            <div key={stars} className="rating-bar">
              <span className="stars-label">{stars}★</span>
              <div className="rating-bar-container">
                <div 
                  className="rating-bar-fill" 
                  style={{ 
                    width: `${(count / ratingData.totalReviews) * 100}%` 
                  }}
                ></div>
              </div>
              <span className="rating-count-label">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
