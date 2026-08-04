import React from 'react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ProductReviews = ({ reviews, reviewCount, ratingSummary, onWriteReview }) => (
  <div className="reviews-section">
    <div className="reviews-header">
      <div>
        <h3>Customer Reviews</h3>
        {reviewCount > 0 && (
          <div className="rating-summary">
            <div className="stars-display">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= Math.round(ratingSummary / 20) ? 'star-filled' : 'star-empty'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-text">
              {(ratingSummary / 20).toFixed(1)} out of 5 ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </div>
      <button onClick={onWriteReview} className="write-review-btn">
        Write a review
      </button>
    </div>

    {reviewCount === 0 ? (
      <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
    ) : (
      <div className="reviews-list">
        {reviews.map((review, index) => (
          <div key={index} className="review-item">
            <div className="review-header-item">
              <div>
                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= review.average_rating ? 'star-filled' : 'star-empty'}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="review-author">
                  {review.nickname} • {formatDate(review.created_at)}
                </p>
              </div>
            </div>
            <h4 className="review-summary">{review.summary}</h4>
            <p className="review-text">{review.text}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ProductReviews;
