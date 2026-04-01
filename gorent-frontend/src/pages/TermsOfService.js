function TermsOfService() {
  return (
    <div className="page">
      <div className="container">
        <header className="page-header legal-header">
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-subtitle">Terms and conditions that govern use of the GoRent platform.</p>
        </header>

        <section className="legal-container">
          <article className="legal-card">
            <h2>1. Eligibility and Account Responsibility</h2>
            <p>
              Users must provide accurate and current information while registering and booking. You are responsible
              for all activity under your account credentials.
            </p>
          </article>

          <article className="legal-card">
            <h2>2. Booking and Availability</h2>
            <p>
              Vehicle listings, prices, and availability may change and are confirmed at the time of booking.
              Reservation details shown during checkout form part of your rental agreement.
            </p>
          </article>

          <article className="legal-card">
            <h2>3. Payments, Cancellations, and Refunds</h2>
            <p>
              Charges, cancellation windows, and refund conditions are applied according to the terms displayed
              at checkout and on your booking details page.
            </p>
          </article>

          <article className="legal-card">
            <h2>4. Prohibited Activities</h2>
            <ul className="legal-list">
              <li>Fraudulent bookings or payment misuse.</li>
              <li>Unauthorized access attempts or service disruption.</li>
              <li>Submission of false identity or vehicle usage information.</li>
            </ul>
          </article>

          <article className="legal-card legal-highlight">
            <p>
              By accessing or using GoRent, you agree to these Terms of Service. Continued use after updates means
              you accept the revised terms.
            </p>
          </article>
        </section>

        <section className="legal-meta">
          <p>Last Updated: April 1, 2026</p>
          <p>Contact: legal@gorent.com</p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfService;
