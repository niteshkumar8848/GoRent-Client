import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useToast } from "../components/Toast";

// Get API URL from environment or use default
const getApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;
  // For development, try to detect if running on localhost
  if (window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }
  // For production, construct URL from current hostname
  return `${window.location.protocol}//${window.location.host}/api`;
};

const API_URL = getApiUrl();

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/uploads")) {
    // Use the API base URL for images
    return API_URL.replace("/api", "") + imagePath;
  }
  return API_URL.replace("/api", "") + imagePath;
};

// Axios instance with timeout
const api = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToast } = useToast();
  
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brand, setBrand] = useState("");
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchVehicles = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (brand) params.append("brand", brand);

      const res = await api.get(`${API_URL}/vehicles?${params}`);
      
      // Handle new response format
      const vehiclesData = res.data.data || res.data;
      setVehicles(vehiclesData);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else {
        setError("Failed to load vehicles");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVehicles(true);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const calculateDays = () => {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const calculateTotal = () => {
    if (!selectedVehicle) return 0;
    return calculateDays() * selectedVehicle.pricePerDay;
  };

  const handleBooking = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (calculateDays() <= 0) {
      setBookingError("End date must be after start date");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");
      
      const res = await api.post(
        `${API_URL}/bookings`,
        {
          vehicleId: selectedVehicle._id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      addToast("Booking successful!", "success");
      setSelectedVehicle(null);
      navigate("/bookings");
    } catch (err) {
      console.error("Booking error:", err);
      if (err.response?.data?.message) {
        setBookingError(err.response.data.message);
      } else {
        setBookingError("Failed to create booking");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const brands = [...new Set(vehicles.map(v => v.brand).filter(Boolean))];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Find Your Perfect Vehicle</h1>
          <p className="page-subtitle">Choose from our wide range of vehicles at affordable prices</p>
        </div>

        <div className="search-filter">
          <form onSubmit={handleSearch} className="search-filters">
            <input
              type="text"
              placeholder="Search vehicles..."
              className="form-input search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Max Price per Day"
              className="form-input"
              style={{ maxWidth: "200px" }}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {vehicles.length > 0 ? (
              <div className="vehicle-grid">
                {vehicles.map(vehicle => (
                  <div key={vehicle._id} className="vehicle-card">
                    <img
                      src={getImageUrl(vehicle.image) || "https://via.placeholder.com/300x200?text=No+Image"}
                      alt={vehicle.name}
                      className="vehicle-image"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                    <div className="vehicle-content">
                      <h3 className="vehicle-name">{vehicle.name}</h3>
                      <p className="vehicle-brand">{vehicle.brand}</p>
                      <p className="vehicle-price">
                        ₹{vehicle.pricePerDay} <span>/ day</span>
                      </p>
                      <div className="vehicle-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => setSelectedVehicle(vehicle)}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🚗</div>
                <h3 className="empty-state-title">No vehicles found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        )}

        {selectedVehicle && (
          <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Book {selectedVehicle.name}</h2>
                <button
                  className="modal-close"
                  onClick={() => setSelectedVehicle(null)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {bookingError && (
                  <div className="alert alert-error">{bookingError}</div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    className="form-input"
                    dateFormat="MMM dd, yyyy"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="form-input"
                    dateFormat="MMM dd, yyyy"
                  />
                </div>

                <div className="booking-card" style={{ marginTop: "1rem" }}>
                  <div className="d-flex justify-between align-center">
                    <span>Price per day:</span>
                    <span>₹{selectedVehicle.pricePerDay}</span>
                  </div>
                  <div className="d-flex justify-between align-center mt-1">
                    <span>Number of days:</span>
                    <span>{calculateDays()}</span>
                  </div>
                  <hr style={{ margin: "1rem 0" }} />
                  <div className="d-flex justify-between align-center">
                    <strong>Total:</strong>
                    <strong style={{ color: "var(--primary-color)", fontSize: "1.25rem" }}>
                      ₹{calculateTotal()}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedVehicle(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBooking}
                  disabled={bookingLoading || calculateDays() <= 0}
                >
                  {bookingLoading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

