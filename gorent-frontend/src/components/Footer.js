import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-content">
        <div>
          <h3 className="site-footer-brand">GoRent</h3>
          <p className="site-footer-tagline">Smart Car Rentals, Simplified.</p>
        </div>

        <div className="site-footer-links">
          <h4>Navigation</h4>
          <Link to="/">Home</Link>
          <Link to="/">Browse Cars</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>

        <div className="site-footer-social">
          <h4>Follow Us</h4>
          <a href="/#">Facebook</a>
          <a href="/#">Instagram</a>
          <a href="/#">Twitter/X</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>© 2025 GoRent. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
