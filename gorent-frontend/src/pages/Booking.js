import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";
import RideFeedback from "../components/RideFeedback";

// Get API URL from environment or use default
const getApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;
  if (window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }
  return `${window.location.protocol}//${window.location.host}/api`;
};

const API_URL = getApiUrl();

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const normalizedPath = String(imagePath).trim().replace(/\\/g, "/");
  if (normalizedPath.startsWith("http")) return normalizedPath;

  const apiOrigin = API_URL.replace(/\/api\/?$/, "");
  const apiBase = API_URL.replace(/\/$/, "");

  // Route uploaded files through /api/uploads for proxy-based deployments
  if (normalizedPath.startsWith("/uploads")) {
    return `${apiBase}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("uploads/")) {
    return `${apiBase}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/")) {
    return `${apiOrigin}${normalizedPath}`;
  }

  return `${apiOrigin}/${normalizedPath}`;
};

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [feedbackRide, setFeedbackRide] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [dismissedRideIds, setDismissedRideIds] = useState([]);
  const { addToast } = useToast();
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    fetchBookings(true);
  }, []);

  useEffect(() => {
    if (feedbackRide) return;
    const pendingFeedbackRide = bookings.find(
      (booking) => booking.status === "completed"
        && !booking.feedbackSubmitted
        && !booking.feedback_submitted
        && !dismissedRideIds.includes(booking._id)
    );
    if (pendingFeedbackRide) {
      setFeedbackRide(pendingFeedbackRide);
    }
  }, [bookings, feedbackRide, dismissedRideIds]);

  const fetchBookings = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      
      const token = localStorage.getItem("token");
      
      const res = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      // Handle both old format (array) and new format ({success, data})
      let bookingData = [];
      if (Array.isArray(res.data)) {
        bookingData = res.data;
      } else if (res.data && res.data.data) {
        bookingData = res.data.data;
      }
      
      setBookings(bookingData);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else {
        setError("Failed to load bookings");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleCancel = async (bookingId) => {
    confirm("Are you sure you want to cancel this booking?", async () => {
      try {
        setCancelling(bookingId);
        const token = localStorage.getItem("token");
        
        const res = await axios.put(
          `${API_URL}/bookings/${bookingId}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        fetchBookings();
        addToast(res.data?.message || "Booking cancelled successfully", "success");
      } catch (err) {
        console.error("Cancel booking error:", err);
        addToast(err.response?.data?.message || "Failed to cancel booking", "error");
      } finally {
        setCancelling(null);
      }
    });
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      pending: "status-pending",
      confirmed: "status-confirmed",
      completed: "status-completed",
      cancelled: "status-cancelled"
    };
    return statusClasses[status] || "status-pending";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleFeedbackSubmit = async (payload) => {
    try {
      setFeedbackLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/feedback`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      addToast(response.data?.message || "Feedback submitted", "success");
      setDismissedRideIds((prev) => [...prev, payload.booking_id]);
      setFeedbackRide(null);
      fetchBookings(false);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to submit feedback", "error");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleFeedbackSkip = async () => {
    if (!feedbackRide?._id) return;

    try {
      setFeedbackLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/feedback/skip/${feedbackRide._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      addToast(response.data?.message || "Feedback skipped", "info");
      setDismissedRideIds((prev) => [...prev, feedbackRide._id]);
      setFeedbackRide(null);
      fetchBookings(false);
    } catch (err) {
      addToast(err.response?.data?.message || "Unable to skip feedback right now", "error");
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">View and manage your vehicle bookings</p>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : bookings.length > 0 ? (
          <div>
            {bookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {booking.vehicle?.image && (
                      <img 
                        src={getImageUrl(booking.vehicle.image)} 
                        alt={booking.vehicle?.name || "Vehicle"}
                        style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/80x60?text=No+Image";
                        }}
                      />
                    )}
                    <div>
                      <h3 className="booking-vehicle">
                        {booking.vehicle?.name || "Vehicle"}
                      </h3>
                      <p className="vehicle-brand">
                        {booking.vehicle?.brand || ""}
                      </p>
                    </div>
                  </div>
                  <span className={`booking-status ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="booking-dates">
                  <p><strong>Start Date:</strong> {formatDate(booking.startDate)}</p>
                  <p><strong>End Date:</strong> {formatDate(booking.endDate)}</p>
                  {booking.pickupLocation?.address && (
                    <p><strong>Pickup:</strong> {booking.pickupLocation.address}</p>
                  )}
                </div>
                
                <div className="d-flex justify-between align-center mt-2">
                  <p className="booking-price">₹{booking.totalPrice}</p>
                  
                  {booking.status !== "cancelled" && booking.status !== "completed" && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(booking._id)}
                      disabled={cancelling === booking._id}
                    >
                      {cancelling === booking._id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No bookings yet</h3>
            <p>Start by browsing our vehicles and making your first booking!</p>
          </div>
        )}
      </div>
      {feedbackRide && (
        <RideFeedback
          booking={feedbackRide}
          loading={feedbackLoading}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleFeedbackSkip}
        />
      )}
    </div>
  );
}

export default Bookings;
