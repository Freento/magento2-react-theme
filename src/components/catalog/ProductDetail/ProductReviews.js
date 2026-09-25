import React from 'react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ProductReviews = ({ reviews, reviewCount, ratingSummary, onWriteReview }) => (
  <div className="reviews-section py-2">
    <div className="reviews-header flex justify-between items-start mb-6 gap-4 max768:flex-col max768:items-stretch">
      <div>
        <h3 className="text-13 tracking-[0.12em] uppercase font-medium text-ink mb-1.5">Customer Reviews</h3>
        {reviewCount > 0 && (
          <div className="rating-summary flex items-center gap-2.5 mt-1.5 text-13 text-ink-2">
            <div className="stars-display flex gap-[2px]">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= Math.round(ratingSummary / 20) ? 'star-filled text-ink text-lg' : 'star-empty text-line text-lg'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-text text-ink-2 text-13 font-serif italic">
              {(ratingSummary / 20).toFixed(1)} out of 5 ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </div>
      <button onClick={onWriteReview} className="write-review-btn inline-flex items-center justify-center min-h-[44px] py-3 px-[22px] rounded text-base font-medium tracking-[0.02em] cursor-pointer bg-ink text-bg border border-ink [transition:background-color_200ms_ease,color_200ms_ease,border-color_200ms_ease] hover:enabled:bg-black whitespace-nowrap max768:w-full">
        Write a review
      </button>
    </div>

    {reviewCount === 0 ? (
      <p className="no-reviews text-ink-2 font-serif italic mt-3 text-base">No reviews yet. Be the first to review this product!</p>
    ) : (
      <div className="reviews-list flex flex-col gap-4 mt-5">
        {reviews.map((review, index) => (
          <div key={index} className="review-item p-5 max768:p-4 border border-line rounded-lg bg-bg">
            <div className="review-header-item mb-2.5">
              <div>
                <div className="review-stars flex gap-[2px] mb-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= review.average_rating ? 'star-filled text-ink text-lg' : 'star-empty text-line text-lg'}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="review-author text-ink-2 text-13 m-0">
                  {review.nickname} • {formatDate(review.created_at)}
                </p>
              </div>
            </div>
            <h4 className="review-summary text-[16px] font-medium text-ink mt-0 mb-1.5 tracking-[-0.01em]">{review.summary}</h4>
            <p className="review-text text-ink-2 leading-[1.6] m-0 text-base">{review.text}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ProductReviews;
