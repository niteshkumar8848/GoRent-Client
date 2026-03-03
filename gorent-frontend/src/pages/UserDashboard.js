import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { addToast } = useToast();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000 // 10 second timeout
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/auth/me`, config);
      
      // Handle both old and new response formats
      const userData = res.data.data || res.data;
      setUser(userData);
      setProfileForm(prev => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || ""
      }));
    } catch (err) {
      console.error("Error fetching profile:", err);
      addToast(err.response?.data?.message || "Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

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

      const res = await axios.put(`${API_URL}/auth/me`, updateData, config);
      
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
      
      // Refresh user profile
      fetchUserProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      addToast(err.response?.data?.message || err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
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
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Manage your account and view your bookings</p>
        </div>


        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div>
            <div className="settings-container">
              <h2>Profile Settings</h2>
              <p className="settings-subtitle">Update your personal information</p>
              
              <div className="settings-card">
                <div className="settings-info">
                  <div className="info-row">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{user?.role || "user"}</span>
                  </div>
                </div>
                
                <form onSubmit={handleProfileSubmit} className="settings-form">
                  <h3>Update Information</h3>
                  
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
                      placeholder="Enter current password (required for changes)"
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
      </div>
    </div>
  );
}

export default UserDashboard;

