import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";

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
const BASE_URL = API_URL.replace("/api", "");

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/uploads")) {
    return BASE_URL + imagePath;
  }
  return BASE_URL + imagePath;
};

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const { addToast } = useToast();
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    fetchBookings(true);
  }, []);

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
    </div>
  );
}

export default Bookings;

