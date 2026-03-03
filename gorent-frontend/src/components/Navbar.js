import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "./ThemeProvider";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/logo.jpg" alt="GoRent" className="navbar-logo" />
        </Link>
        
        <div className="navbar-menu">
          <Link 
            to="/" 
            className={`navbar-link ${isActive("/") ? "active" : ""}`}
          >
            Home
          </Link>
          
          {token && (
            <Link 
              to="/bookings" 
              className={`navbar-link ${isActive("/bookings") ? "active" : ""}`}
            >
              My Bookings
            </Link>
          )}
          
          {user?.role === "admin" && (
            <Link 
              to="/admin" 
              className={`navbar-link ${isActive("/admin") ? "active" : ""}`}
            >
              Admin Dashboard
            </Link>
          )}
          
          {token && user?.role !== "admin" && (
            <Link 
              to="/dashboard" 
              className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}
            >
              My Dashboard
            </Link>
          )}
          
          <div className="navbar-user">
            {token ? (
              <>
                <span>Welcome, {user?.name || "User"}</span>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
            {/* Theme Toggle Button */}
            <button 
              className="btn btn-outline btn-sm theme-toggle" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

