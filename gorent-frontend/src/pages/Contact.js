function Contact() {
  return (
    <div className="page">
      <div className="container">
        <header className="page-header legal-header">
          <h1 className="page-title">Contact</h1>
          <p className="page-subtitle">Need help with your rental? Our support team is ready to assist.</p>
        </header>

        <section className="legal-container">
          <div className="contact-grid">
            <article className="legal-card">
              <h2>Customer Support</h2>
              <p className="legal-muted">For booking, payment, and cancellation assistance.</p>
              <p><strong>Email:</strong> <a href="mailto:support@gorent.com">support@gorent.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:+977010000000">+977-01-0000000</a></p>
              <p><strong>Hours:</strong> Daily, 9:00 AM - 8:00 PM</p>
            </article>

            <article className="legal-card">
              <h2>Business & Partnerships</h2>
              <p className="legal-muted">For fleet onboarding and strategic collaboration.</p>
              <p><strong>Email:</strong> <a href="mailto:partners@gorent.com">partners@gorent.com</a></p>
              <p><strong>Response Time:</strong> Within 1-2 business days</p>
            </article>
          </div>

          <article className="legal-card legal-highlight">
            <h2>Before You Contact Us</h2>
            <ul className="legal-list">
              <li>Include your booking ID and registered email.</li>
              <li>Share screenshots when reporting a technical issue.</li>
              <li>For urgent trip-day issues, call support for fastest help.</li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}

export default Contact;
