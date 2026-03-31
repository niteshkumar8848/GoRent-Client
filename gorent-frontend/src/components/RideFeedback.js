import { useMemo, useState } from "react";
import PropTypes from "prop-types";

const FEEDBACK_TAGS = [
  "Clean Vehicle",
  "On Time",
  "Good Condition",
  "Great Service",
  "Late Arrival",
  "Poor Condition",
  "Miscommunication"
];

function RideFeedback({ booking, loading, onSubmit, onSkip }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState([]);

  const remainingCharacters = useMemo(() => 300 - comment.length, [comment.length]);

  const toggleTag = (tag) => {
    setTags((prevTags) => (
      prevTags.includes(tag)
        ? prevTags.filter((item) => item !== tag)
        : [...prevTags, tag]
    ));
  };

  const handleSubmit = () => {
    if (rating < 1) return;

    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    onSubmit({
      booking_id: booking._id,
      vehicle_id: booking?.vehicle?._id,
      customer_id: booking?.user?._id || booking?.user || currentUser?.id,
      rating,
      comment,
      tags
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal ride-feedback-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">How was your ride?</h2>
        </div>

        <div className="modal-body">
          <p className="ride-feedback-subtitle">
            {booking?.vehicle?.name || "Your ride"} has been completed. Share your feedback.
          </p>

          <div className="ride-feedback-stars" role="radiogroup" aria-label="Ride rating">
            {[1, 2, 3, 4, 5].map((starValue) => (
              <button
                key={starValue}
                type="button"
                className={`ride-star ${rating >= starValue ? "active" : ""}`}
                aria-label={`${starValue} star`}
                onClick={() => setRating(starValue)}
              >
                ★
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Comments (optional)</label>
            <textarea
              className="form-input ride-feedback-textarea"
              maxLength={300}
              placeholder="Tell us about your ride experience"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <p className="ride-feedback-counter">{remainingCharacters} characters left</p>
          </div>

          <div className="ride-feedback-tags">
            {FEEDBACK_TAGS.map((tag) => (
              <button
                type="button"
                key={tag}
                className={`ride-tag-chip ${tags.includes(tag) ? "active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onSkip} disabled={loading}>
            Skip
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || rating < 1}
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

RideFeedback.propTypes = {
  booking: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    vehicle: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string
    }),
    user: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.string })
    ])
  }).isRequired,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
};

RideFeedback.defaultProps = {
  loading: false
};

export default RideFeedback;
