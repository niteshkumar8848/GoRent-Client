import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "./ThemeProvider";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-top">
          <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
            <img src="/logo.jpg" alt="GoRent" className="navbar-logo" />
          </Link>

          <button
            type="button"
            className={`navbar-menu-toggle ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`}>
          <Link 
            to="/" 
            className={`navbar-link ${isActive("/") ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          
          {token && (
            <Link 
              to="/bookings" 
              className={`navbar-link ${isActive("/bookings") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              My Bookings
            </Link>
          )}
          
          {user?.role === "admin" && (
            <Link 
              to="/admin" 
              className={`navbar-link ${isActive("/admin") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          
          {token && user?.role !== "admin" && (
            <Link 
              to="/dashboard" 
              className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              My Dashboard
            </Link>
          )}
          
          <div className="navbar-user">
            {token ? (
              <>
                <span>Welcome, {user?.name || "User"}</span>
                <button onClick={handleLogout} className="btn btn-danger btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileMenuOpen(false)}>
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
