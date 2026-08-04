import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_PRODUCT_REVIEW } from '../../../queries/product';

// Magento's single "Rating" attribute with its 1–5 value ids. Hardcoded to
// avoid the productReviewRatingsMetadata request on every product page.
const RATING_METADATA = [
  {
    id: 'NA==',
    name: 'Rating',
    values: [
      { value_id: 'MTY=', value: '1' },
      { value_id: 'MTc=', value: '2' },
      { value_id: 'MTg=', value: '3' },
      { value_id: 'MTk=', value: '4' },
      { value_id: 'MjA=', value: '5' },
    ],
  },
];

const ReviewModal = ({ open, onClose, productSku, isAuthenticated, openLoginModal, onSubmitted }) => {
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({
    nickname: '',
    rating: 5,
    summary: '',
    text: ''
  });

  const ratingMetadata = RATING_METADATA;
  const [createReview, { loading: reviewLoading }] = useMutation(CREATE_PRODUCT_REVIEW);

  if (!open) return null;

  const handleReviewFormChange = (field, value) => {
    setReviewForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setReviewMessage('Please log in to write a review.');
      setTimeout(() => {
        onClose();
        openLoginModal();
      }, 2000);
      return;
    }

    try {
      // Build ratings array from metadata
      let ratingsArray = [];

      if (ratingMetadata.length > 0) {
        // For each rating type (Quality, Price, Value), find the corresponding value_id
        ratingMetadata.forEach((ratingType) => {
          const ratingValue = ratingType.values.find((v) => parseInt(v.value) === reviewForm.rating);
          if (ratingValue) {
            ratingsArray.push({ id: ratingType.id, value_id: ratingValue.value_id });
          }
        });
      }

      if (ratingsArray.length === 0) {
        ratingsArray.push({ id: btoa('1'), value_id: btoa(reviewForm.rating.toString()) });
      }

      await createReview({
        variables: {
          input: {
            sku: productSku,
            nickname: reviewForm.nickname,
            summary: reviewForm.summary,
            text: reviewForm.text,
            ratings: ratingsArray
          }
        }
      });

      setReviewMessage('Thank you for your review! It will be visible after approval.');
      setReviewForm({ nickname: '', rating: 5, summary: '', text: '' });

      setTimeout(() => {
        onSubmitted?.();
        onClose();
        setReviewMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting review:', error);
      let errorMessage = 'Failed to submit review. Please try again.';
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setReviewMessage(errorMessage);
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Write a Review</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleReviewSubmit} className="review-form">
          {reviewMessage && (
            <div className={`review-message ${reviewMessage.includes('Failed') || reviewMessage.includes('log in') ? 'error' : 'success'}`}>
              {reviewMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nickname">Nickname *</label>
            <input
              type="text"
              id="nickname"
              value={reviewForm.nickname}
              onChange={(e) => handleReviewFormChange('nickname', e.target.value)}
              required
              placeholder="Enter your nickname"
              disabled={reviewLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rating">Rating *</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= reviewForm.rating ? 'filled' : ''}`}
                  onClick={() => handleReviewFormChange('rating', star)}
                  disabled={reviewLoading}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="summary">Summary *</label>
            <input
              type="text"
              id="summary"
              value={reviewForm.summary}
              onChange={(e) => handleReviewFormChange('summary', e.target.value)}
              required
              placeholder="Brief summary of your review"
              disabled={reviewLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="text">Review *</label>
            <textarea
              id="text"
              value={reviewForm.text}
              onChange={(e) => handleReviewFormChange('text', e.target.value)}
              required
              rows="5"
              placeholder="Write your detailed review here..."
              disabled={reviewLoading}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={reviewLoading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={reviewLoading}>
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
