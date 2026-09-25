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

const ReviewModal = ({ open, onClose, productSku, isAuthenticated, guestReviewsAllowed, openLoginModal, onSubmitted }) => {
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

    if (!isAuthenticated && !guestReviewsAllowed) {
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
    <div className="review-modal-overlay fixed inset-0 bg-ink/40 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="review-modal bg-bg rounded-lg max-w-[560px] w-full max-h-[90vh] overflow-y-auto [box-shadow:0_20px_40px_rgba(0,0,0,0.12)] border border-line max768:m-3" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header flex justify-between items-center py-5 px-6 max768:p-4 border-b border-line">
          <h2 className="m-0 text-[16px] max768:text-md font-semibold text-ink tracking-[-0.01em]">Write a Review</h2>
          <button className="close-btn w-8 h-8 inline-flex items-center justify-center bg-transparent cursor-pointer rounded-pill text-ink-2 [transition:background-color_120ms_ease,color_120ms_ease] hover:bg-surface hover:text-ink text-xl p-0" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleReviewSubmit} className="review-form pt-[22px] px-6 pb-6 max768:p-4">
          {reviewMessage && (
            <div className={`review-message ${reviewMessage.includes('Failed') || reviewMessage.includes('log in') ? 'error' : 'success'} py-2.5 px-3.5 rounded mb-[18px] text-13 font-medium border border-line [&.success]:bg-surface [&.success]:text-ink [&.success]:border-ink [&.error]:bg-danger-bg [&.error]:text-sale [&.error]:border-sale`}>
              {reviewMessage}
            </div>
          )}

          <div className="form-group mb-[18px]">
            <label htmlFor="nickname" className="block mb-1.5 font-medium text-ink text-13">Nickname *</label>
            <input
              type="text"
              id="nickname"
              className="w-full py-3 px-3.5 border border-line rounded [font-family:inherit] leading-base text-base bg-bg text-ink [transition:border-color_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
              value={reviewForm.nickname}
              onChange={(e) => handleReviewFormChange('nickname', e.target.value)}
              required
              placeholder="Enter your nickname"
              disabled={reviewLoading}
            />
          </div>

          <div className="form-group mb-[18px]">
            <label htmlFor="rating" className="block mb-1.5 font-medium text-ink text-13">Rating *</label>
            <div className="rating-stars flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= reviewForm.rating ? 'filled' : ''} cursor-pointer text-[26px] text-line [transition:color_120ms_ease,transform_120ms_ease] p-0 [&.filled]:text-ink hover:scale-110`}
                  onClick={() => handleReviewFormChange('rating', star)}
                  disabled={reviewLoading}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="form-group mb-[18px]">
            <label htmlFor="summary" className="block mb-1.5 font-medium text-ink text-13">Summary *</label>
            <input
              type="text"
              id="summary"
              className="w-full py-3 px-3.5 border border-line rounded [font-family:inherit] leading-base text-base bg-bg text-ink [transition:border-color_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
              value={reviewForm.summary}
              onChange={(e) => handleReviewFormChange('summary', e.target.value)}
              required
              placeholder="Brief summary of your review"
              disabled={reviewLoading}
            />
          </div>

          <div className="form-group mb-[18px]">
            <label htmlFor="text" className="block mb-1.5 font-medium text-ink text-13">Review *</label>
            <textarea
              id="text"
              className="w-full py-3 px-3.5 border border-line rounded [font-family:inherit] leading-base text-base bg-bg text-ink [transition:border-color_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)] resize-y min-h-[90px]"
              value={reviewForm.text}
              onChange={(e) => handleReviewFormChange('text', e.target.value)}
              required
              rows="5"
              placeholder="Write your detailed review here..."
              disabled={reviewLoading}
            />
          </div>

          <div className="form-actions flex gap-2 justify-end mt-6 max768:flex-col">
            <button type="button" className="cancel-btn py-3 px-[22px] rounded text-base font-medium tracking-[0.02em] cursor-pointer [transition:background-color_200ms_ease,border-color_200ms_ease] border max768:w-full border-line bg-bg text-ink hover:bg-surface hover:border-ink" onClick={onClose} disabled={reviewLoading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn py-3 px-[22px] rounded text-base font-medium tracking-[0.02em] cursor-pointer [transition:background-color_200ms_ease,border-color_200ms_ease] border max768:w-full bg-ink text-bg border-ink hover:bg-black" disabled={reviewLoading}>
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
