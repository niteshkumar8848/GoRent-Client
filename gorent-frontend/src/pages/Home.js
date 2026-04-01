import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useToast } from "../components/Toast";
import VehicleDetailsCard from "../components/VehicleDetailsCard";
import VehicleAvailabilityMap from "../components/VehicleAvailabilityMap";
import PickupLocationSelector from "../components/PickupLocationSelector";

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
  const [contactNumber, setContactNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState({
    address: "",
    lat: null,
    lng: null
  });
  const [userLocation, setUserLocation] = useState(null);
  const [vehicleLocations, setVehicleLocations] = useState([]);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchVehicles = async (
    showLoading = true,
    filters = { search, maxPrice, brand }
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.brand) params.append("brand", filters.brand);

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
    fetchVehicleLocations();
  }, []);

  const fetchVehicleLocations = async () => {
    try {
      const response = await api.get(`${API_URL}/vehicles/locations`);
      const locationsData = response.data?.data || [];
      setVehicleLocations(locationsData);
    } catch (err) {
      setVehicleLocations([]);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleClearFilters = () => {
    setSearch("");
    setBrand("");
    setMaxPrice("");
    fetchVehicles(true, { search: "", maxPrice: "", brand: "" });
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

    if (!pickupLocation.address) {
      setBookingError("Please set a pickup location before confirming the booking");
      return;
    }

    const normalizedContactNumber = contactNumber.replace(/[\s()-]/g, "").trim();
    if (!/^\+?[0-9]{7,15}$/.test(normalizedContactNumber)) {
      setBookingError("Please enter a valid mobile number");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");
      
      await api.post(
        `${API_URL}/bookings`,
        {
          vehicleId: selectedVehicle._id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          pickupLocation,
          contactNumber: normalizedContactNumber
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      addToast("Booking successful!", "success");
      setSelectedVehicle(null);
      setPickupLocation({
        address: "",
        lat: null,
        lng: null
      });
      setContactNumber("");
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
          <div className="filter-header">
            <h2 className="filter-title">Filter Vehicles</h2>
            <p className="filter-subtitle">Refine results by keyword, brand, and budget.</p>
          </div>
          <form onSubmit={handleSearch} className="search-filters">
            <div className="filter-field filter-field-search">
              <label htmlFor="vehicle-search" className="filter-label">Search</label>
              <input
                id="vehicle-search"
                type="text"
                placeholder="Search vehicles..."
                className="form-input search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label htmlFor="brand-filter" className="filter-label">Brand</label>
              <select
                id="brand-filter"
                className="filter-select"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="price-filter" className="filter-label">Max Price/Day</label>
              <input
                id="price-filter"
                type="number"
                placeholder="e.g. 1200"
                className="form-input"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              <button
                type="button"
                className="btn filter-clear-btn"
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <VehicleAvailabilityMap userLocation={userLocation} vehicles={vehicleLocations} />

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
                      <VehicleDetailsCard vehicle={vehicle} />
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

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter your mobile number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                  <small className="form-hint">This number will be visible to admin for booking coordination.</small>
                </div>

                <PickupLocationSelector
                  value={pickupLocation}
                  onChange={(nextLocation) => setPickupLocation(nextLocation)}
                />

                <div className="booking-card" style={{ marginTop: "1rem" }}>
                  <VehicleDetailsCard vehicle={selectedVehicle} />
                  <div className="d-flex justify-between align-center">
                    <span>Price per day:</span>
                    <span>₹{selectedVehicle.pricePerDay}</span>
                  </div>
                  <div className="d-flex justify-between align-center mt-1">
                    <span>Number of days:</span>
                    <span>{calculateDays()}</span>
                  </div>
                  <div className="d-flex justify-between align-center mt-1">
                    <span>Pickup:</span>
                    <span>{pickupLocation.address || "Not set"}</span>
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
