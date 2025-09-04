import React, { useState } from 'react';
import axios from 'axios';

const RatingModal = ({ isOpen, onClose, jobId, reviewedUserId, reviewedUserName, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await axios.post('/api/ratings', {
        jobId,
        reviewedUserId,
        rating,
        comment: comment.trim() || null
      });
      
      onSubmit();
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(error.response?.data?.error || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(0);
    setComment('');
    onCancel();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal rating-modal">
        <div className="modal-header">
          <h3>Rate {reviewedUserName}</h3>
          <button 
            className="modal-close"
            onClick={handleCancel}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${star <= (hoveredRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="rating-label">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
                {rating === 0 && 'Select a rating'}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Comment (Optional)</label>
              <textarea
                className="form-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience working with this user..."
                rows="4"
                maxLength="500"
              />
              <div className="char-count">
                {comment.length}/500 characters
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
