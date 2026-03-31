import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";
import VehicleDetailsCard from "../components/VehicleDetailsCard";
import AdminLocationPickerMap from "../components/AdminLocationPickerMap";

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

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToast } = useToast();
  const { confirm } = useConfirmDialog();
  
  // Admin profile state
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Vehicle form state
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    name: "",
    brand: "",
    pricePerDay: "",
    seats: "",
    fuelType: "",
    category: "",
    ac: "",
    luggage_capacity: "",
    pickup_locations: [{ name: "", lat: "", lng: "" }],
    available: true
  });
  const [vehicleImage, setVehicleImage] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [mapPickerIndex, setMapPickerIndex] = useState(null);

  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000 // 10 second timeout
  };

  useEffect(() => {
    // Initial fetch with loading indicator
    fetchData(true);
    
    // Poll for updates every 5 seconds WITHOUT loading indicator
    // Only in development - remove in production for better performance
    if (process.env.NODE_ENV !== "production") {
      const interval = setInterval(() => {
        fetchData(false);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      await Promise.all([
        fetchBookings(showLoading),
        fetchVehicles(showLoading),
        fetchUsers(showLoading),
        fetchAdminProfile(showLoading),
        fetchFeedbackSummary(showLoading)
      ]);
    } catch (err) {
      if (showLoading) {
        setError("Failed to load data");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchAdminProfile = async (showLoading = true) => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, config);
      
      // Handle both old and new response formats
      const userData = res.data.data || res.data;
      
      setAdminProfile(prev => {
        // Only update if data changed
        if (JSON.stringify(prev) !== JSON.stringify(userData)) {
          return userData;
        }
        return prev;
      });
      
      if (showLoading || !adminProfile) {
        setProfileForm(prev => ({ 
          ...prev, 
          name: userData.name || "",
          email: userData.email || "" 
        }));
      }
    } catch (err) {
      console.error("Failed to fetch admin profile");
    }
  };

  const fetchBookings = async (showLoading = true) => {
    try {
      const res = await axios.get(`${API_URL}/bookings/all`, config);
      
      // Handle both old format (array) and new format ({success, data})
      let bookingData = [];
      if (Array.isArray(res.data)) {
        bookingData = res.data;
      } else if (res.data && res.data.data) {
        bookingData = res.data.data;
      }
      
      setBookings(prev => {
        // Only update if data changed
        if (JSON.stringify(prev) !== JSON.stringify(bookingData)) {
          return bookingData;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to fetch bookings");
    }
  };

  const fetchVehicles = async (showLoading = true) => {
    try {
      const res = await axios.get(`${API_URL}/vehicles?includeUnavailable=true`);
      
      // Handle both old format (array) and new format ({success, data})
      let vehicleData = [];
      if (Array.isArray(res.data)) {
        vehicleData = res.data;
      } else if (res.data && res.data.data) {
        vehicleData = res.data.data;
      }
      
      setVehicles(prev => {
        // Only update if data changed
        if (JSON.stringify(prev) !== JSON.stringify(vehicleData)) {
          return vehicleData;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to fetch vehicles");
    }
  };

  const fetchUsers = async (showLoading = true) => {
    try {
      const res = await axios.get(`${API_URL}/auth/users`, config);

      let usersData = [];
      if (Array.isArray(res.data)) {
        usersData = res.data;
      } else if (res.data && res.data.data) {
        usersData = res.data.data;
      }

      setUsers(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(usersData)) {
          return usersData;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const fetchFeedbackSummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/feedback/summary`, config);
      const summaryData = Array.isArray(res.data?.data) ? res.data.data : [];
      const summaryMap = {};

      summaryData.forEach((item) => {
        summaryMap[String(item.vehicle_id)] = item;
      });

      setFeedbackSummary(summaryMap);
    } catch (err) {
      setFeedbackSummary({});
    }
  };

  // Booking handlers
  const updateBookingStatus = async (bookingId, status) => {
    // Optimistically update the UI first
    const originalBookings = [...bookings];
    const updatedBookings = bookings.map(b => 
      b._id === bookingId ? { ...b, status: status } : b
    );
    setBookings(updatedBookings);
    
    try {
      const res = await axios.put(
        `${API_URL}/bookings/${bookingId}/status`,
        { status },
        config
      );
      // Success
      addToast(res.data?.message || `Booking ${status} successfully`, "success");
    } catch (err) {
      // Revert on error
      setBookings(originalBookings);
      addToast(err.response?.data?.message || "Failed to update booking", "error");
    }
  };

  // Vehicle handlers
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      setVehicleLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", vehicleForm.name);
      formData.append("brand", vehicleForm.brand);
      formData.append("pricePerDay", vehicleForm.pricePerDay);
      formData.append("seats", vehicleForm.seats);
      formData.append("fuelType", vehicleForm.fuelType);
      formData.append("category", vehicleForm.category);
      formData.append("ac", vehicleForm.ac);
      formData.append("luggage_capacity", vehicleForm.luggage_capacity);
      formData.append("pickup_locations", JSON.stringify(vehicleForm.pickup_locations));
      formData.append("available", vehicleForm.available);
      
      // Append image if selected
      if (vehicleImage) {
        formData.append("image", vehicleImage);
      }
      
      if (editingVehicle) {
        await axios.put(
          `${API_URL}/vehicles/${editingVehicle._id}`,
          formData,
          config
        );
        addToast("Vehicle updated successfully", "success");
      } else {
        await axios.post(`${API_URL}/vehicles`, formData, config);
        addToast("Vehicle added successfully", "success");
      }
      
      setShowVehicleForm(false);
      setEditingVehicle(null);
      setVehicleForm({
        name: "",
        brand: "",
        pricePerDay: "",
        seats: "",
        fuelType: "",
        category: "",
        ac: "",
        luggage_capacity: "",
        pickup_locations: [{ name: "", lat: "", lng: "" }],
        available: true
      });
      setVehicleImage(null);
      setExistingImage("");
      setImagePreview("");
      fetchVehicles();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || "Failed to save vehicle", "error");
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      name: vehicle.name,
      brand: vehicle.brand,
      pricePerDay: vehicle.pricePerDay,
      seats: vehicle.seats ?? "",
      fuelType: vehicle.fuelType || vehicle.fuel_type || "",
      category: vehicle.category || "",
      ac: typeof vehicle.ac === "boolean" ? String(vehicle.ac) : "",
      luggage_capacity: vehicle.luggage_capacity || "",
      pickup_locations: Array.isArray(vehicle.pickup_locations) && vehicle.pickup_locations.length > 0
        ? vehicle.pickup_locations.map((location) => ({
            name: location.name || "",
            lat: location.lat ?? "",
            lng: location.lng ?? ""
          }))
        : [{ name: "", lat: "", lng: "" }],
      available: vehicle.available
    });
    // Use full URL for existing image preview
    setExistingImage(getImageUrl(vehicle.image) || "");
    setImagePreview(getImageUrl(vehicle.image) || "");
    setVehicleImage(null);
    setShowVehicleForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      name: "",
      brand: "",
      pricePerDay: "",
      seats: "",
      fuelType: "",
      category: "",
      ac: "",
      luggage_capacity: "",
      pickup_locations: [{ name: "", lat: "", lng: "" }],
      available: true
    });
    setVehicleImage(null);
    setExistingImage("");
    setImagePreview("");
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    confirm("Are you sure you want to delete this vehicle?", async () => {
      try {
        await axios.delete(`${API_URL}/vehicles/${vehicleId}`, config);
        fetchVehicles();
        addToast("Vehicle deleted successfully", "success");
      } catch (err) {
        addToast(err.response?.data?.message || err.response?.data?.error || "Failed to delete vehicle", "error");
      }
    });
  };

  const toggleVehicleAvailability = async (vehicle) => {
    // Optimistically update the UI first for instant feedback
    const originalAvailable = vehicle.available;
    const updatedVehicles = vehicles.map(v => 
      v._id === vehicle._id ? { ...v, available: !v.available } : v
    );
    setVehicles(updatedVehicles);
    
    try {
      await axios.put(
        `${API_URL}/vehicles/${vehicle._id}`,
        { available: !vehicle.available },
        config
      );
      // No need to refetch, UI is already updated
    } catch (err) {
      // Revert on error
      setVehicles(vehicles.map(v => 
        v._id === vehicle._id ? { ...v, available: originalAvailable } : v
      ));
      addToast(err.response?.data?.message || "Failed to update vehicle", "error");
    }
  };

  const updatePickupLocationField = (index, field, value) => {
    setVehicleForm((prev) => ({
      ...prev,
      pickup_locations: prev.pickup_locations.map((location, locationIndex) => (
        locationIndex === index ? { ...location, [field]: value } : location
      ))
    }));
  };

  const toggleUserBlacklist = async (targetUser, shouldBlacklist) => {
    const endpoint = shouldBlacklist
      ? `${API_URL}/auth/users/${targetUser._id}/blacklist`
      : `${API_URL}/auth/users/${targetUser._id}/unblacklist`;

    const actionText = shouldBlacklist ? "blacklist" : "unblock";
    confirm(`Are you sure you want to ${actionText} this user?`, async () => {
      try {
        await axios.put(
          endpoint,
          shouldBlacklist ? { reason: "Blocked by admin" } : {},
          config
        );
        addToast(`User ${shouldBlacklist ? "blacklisted" : "unblocked"} successfully`, "success");
        fetchUsers(false);
      } catch (err) {
        addToast(err.response?.data?.message || `Failed to ${actionText} user`, "error");
      }
    });
  };

  const addPickupLocationField = () => {
    setVehicleForm((prev) => ({
      ...prev,
      pickup_locations: [...prev.pickup_locations, { name: "", lat: "", lng: "" }]
    }));
  };

  const removePickupLocationField = (index) => {
    setVehicleForm((prev) => ({
      ...prev,
      pickup_locations: prev.pickup_locations.filter((_, locationIndex) => locationIndex !== index)
    }));
  };

  const openLocationPicker = (index) => {
    setMapPickerIndex(index);
  };

  const closeLocationPicker = () => {
    setMapPickerIndex(null);
  };

  const applyMapSelection = async (position) => {
    const [lat, lng] = position;
    if (mapPickerIndex === null) return;

    updatePickupLocationField(mapPickerIndex, "lat", String(lat));
    updatePickupLocationField(mapPickerIndex, "lng", String(lng));

    try {
      const response = await axios.get(`${API_URL}/location/reverse`, {
        params: { lat, lon: lng },
        timeout: 10000
      });
      const address = response.data?.data?.display_name;
      if (address) {
        updatePickupLocationField(mapPickerIndex, "name", address);
      }
    } catch (err) {
      // Keep manual name entry fallback if reverse geocode fails
    } finally {
      closeLocationPicker();
    }
  };

  // Admin profile handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }

    // Check if there's anything to update
    if (!profileForm.name && !profileForm.email && !profileForm.currentPassword && !profileForm.newPassword) {
      addToast("No changes to update", "error");
      return;
    }

    try {
      setProfileLoading(true);
      
      const updateData = {
        name: profileForm.name,
        email: profileForm.email,
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword
      };

      const res = await axios.put(`${API_URL}/auth/admin-profile`, updateData, config);
      
      addToast(res.data?.message || "Profile updated successfully", "success");
      
      // Clear password fields
      setProfileForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      // Update localStorage with new user info
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      
      // Refresh admin profile
      fetchAdminProfile();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
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

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage bookings and vehicles</p>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            Bookings ({bookings.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "vehicles" ? "active" : ""}`}
            onClick={() => setActiveTab("vehicles")}
          >
            Vehicles ({vehicles.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users ({users.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            {bookings.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>User</th>
                    <th>Dates</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking._id}>
                      <td>
                        <strong>{booking.vehicle?.name || "N/A"}</strong>
                        <br />
                        <small>{booking.vehicle?.brand}</small>
                      </td>
                      <td>
                        {booking.user?.name || "N/A"}
                        <br />
                        <small>{booking.user?.email}</small>
                      </td>
                      <td>
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </td>
                      <td>₹{booking.totalPrice}</td>
                      <td>
                        <span className={`booking-status ${getStatusClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        {booking.status === "pending" && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => updateBookingStatus(booking._id, "confirmed")}
                              style={{ marginRight: "0.5rem" }}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => updateBookingStatus(booking._id, "cancelled")}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => updateBookingStatus(booking._id, "completed")}
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3 className="empty-state-title">No bookings yet</h3>
              </div>
            )}
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === "vehicles" && (
          <div>
            <div className="d-flex justify-between align-center mb-3">
              <h2>Vehicle Management</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowVehicleForm(true);
                  setEditingVehicle(null);
                  resetVehicleForm();
                }}
              >
                Add Vehicle
              </button>
            </div>

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
                      <div className="d-flex justify-between align-center">
                        <h3 className="vehicle-name">{vehicle.name}</h3>
                        <span className={`booking-status ${vehicle.available ? "status-confirmed" : "status-cancelled"}`}>
                          {vehicle.available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <p className="vehicle-brand">{vehicle.brand}</p>
                      <p className="vehicle-price">
                        ₹{vehicle.pricePerDay} <span>/ day</span>
                      </p>
                      <VehicleDetailsCard vehicle={vehicle} />
                      <div className="vehicle-feedback-summary">
                        <h4>Feedback</h4>
                        <p>
                          Average Rating: {feedbackSummary[vehicle._id]?.average_rating || "N/A"} (
                          {feedbackSummary[vehicle._id]?.review_count || 0} reviews)
                        </p>
                        {(feedbackSummary[vehicle._id]?.recent_comments || []).map((comment, index) => (
                          <p key={`${vehicle._id}-comment-${index}`} className="vehicle-feedback-comment">
                            "{comment}"
                          </p>
                        ))}
                      </div>
                      <div className="vehicle-actions">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => toggleVehicleAvailability(vehicle)}
                        >
                          {vehicle.available ? "Mark Unavailable" : "Mark Available"}
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEditVehicle(vehicle)}
                          style={{ marginLeft: "0.5rem" }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteVehicle(vehicle._id)}
                          style={{ marginLeft: "0.5rem" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🚗</div>
                <h3 className="empty-state-title">No vehicles yet</h3>
                <p>Add your first vehicle to start renting</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            {users.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((targetUser) => (
                    <tr key={targetUser._id}>
                      <td>{targetUser.name || "N/A"}</td>
                      <td>{targetUser.email || "N/A"}</td>
                      <td>{targetUser.role || "user"}</td>
                      <td>
                        <span className={`booking-status ${targetUser.isBlacklisted ? "status-cancelled" : "status-confirmed"}`}>
                          {targetUser.isBlacklisted ? "Blacklisted" : "Active"}
                        </span>
                      </td>
                      <td>
                        {targetUser.role !== "admin" ? (
                          targetUser.isBlacklisted ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => toggleUserBlacklist(targetUser, false)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => toggleUserBlacklist(targetUser, true)}
                            >
                              Blacklist
                            </button>
                          )
                        ) : (
                          <span className="text-muted">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3 className="empty-state-title">No users found</h3>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <div className="settings-container">
              <h2>Admin Profile Settings</h2>
              <p className="settings-subtitle">Update your name, email or password</p>
              
              <div className="settings-card">
                <div className="settings-info">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{adminProfile?.name || "Admin"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{adminProfile?.email || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{adminProfile?.role || "admin"}</span>
                  </div>
                </div>
                
                <form onSubmit={handleProfileSubmit} className="settings-form">
                  <h3>Update Profile</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter your name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Enter new email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter current password (required for email/password changes)"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                    />
                    <small className="form-hint">Required to change email or password</small>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter new password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    />
                    <small className="form-hint">Minimum 6 characters</small>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Confirm new password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={profileLoading}
                  >
                    {profileLoading ? "Updating..." : "Update Profile"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Form Modal */}
        {showVehicleForm && (
          <div className="modal-overlay" onClick={() => { setShowVehicleForm(false); resetVehicleForm(); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setShowVehicleForm(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleVehicleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Vehicle Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Toyota Innova"
                      value={vehicleForm.name}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Toyota"
                      value={vehicleForm.brand}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Price per Day (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 1500"
                      value={vehicleForm.pricePerDay}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, pricePerDay: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Seats</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 4"
                      min="1"
                      value={vehicleForm.seats}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, seats: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fuel Type</label>
                    <select
                      className="form-input"
                      value={vehicleForm.fuelType}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                    >
                      <option value="">Select fuel type</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="CNG">CNG</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle Category</label>
                    <select
                      className="form-input"
                      value={vehicleForm.category}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Jeep">Jeep</option>
                      <option value="Van">Van</option>
                      <option value="Auto">Auto</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">AC Option</label>
                    <select
                      className="form-input"
                      value={vehicleForm.ac}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, ac: e.target.value })}
                    >
                      <option value="">Not specified</option>
                      <option value="true">AC</option>
                      <option value="false">Non-AC</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Luggage Capacity</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 2 bags"
                      value={vehicleForm.luggage_capacity}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, luggage_capacity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pickup Locations</label>
                    <div className="admin-pickup-locations">
                      {vehicleForm.pickup_locations.map((location, index) => (
                        <div key={`pickup-location-${index}`} className="admin-pickup-row">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Location name"
                            value={location.name}
                            onChange={(e) => updatePickupLocationField(index, "name", e.target.value)}
                          />
                          <input
                            type="number"
                            step="any"
                            className="form-input"
                            placeholder="Latitude"
                            value={location.lat}
                            onChange={(e) => updatePickupLocationField(index, "lat", e.target.value)}
                          />
                          <input
                            type="number"
                            step="any"
                            className="form-input"
                            placeholder="Longitude"
                            value={location.lng}
                            onChange={(e) => updatePickupLocationField(index, "lng", e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openLocationPicker(index)}
                          >
                            Pick on Map
                          </button>
                          {vehicleForm.pickup_locations.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removePickupLocationField(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="btn btn-outline btn-sm" onClick={addPickupLocationField}>
                        Add Location
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Vehicle Image</label>
                    <input
                      type="file"
                      className="form-input"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div style={{ marginTop: "10px" }}>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "8px" }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="d-flex align-center" style={{ gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        checked={vehicleForm.available}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, available: e.target.checked })}
                      />
                      Available for booking
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowVehicleForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={vehicleLoading}
                  >
                    {vehicleLoading ? "Saving..." : (editingVehicle ? "Update" : "Add Vehicle")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {mapPickerIndex !== null && (
          <div className="modal-overlay" onClick={closeLocationPicker}>
            <div className="modal admin-location-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Select Vehicle Pickup Location</h2>
                <button className="modal-close" onClick={closeLocationPicker}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <AdminLocationPickerMap
                  initialPosition={[
                    Number(vehicleForm.pickup_locations[mapPickerIndex]?.lat) || 28.6139,
                    Number(vehicleForm.pickup_locations[mapPickerIndex]?.lng) || 77.209
                  ]}
                  onConfirm={applyMapSelection}
                  onCancel={closeLocationPicker}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
