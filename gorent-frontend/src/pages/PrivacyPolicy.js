function PrivacyPolicy() {
  return (
    <div className="page">
      <div className="container">
        <header className="page-header legal-header">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-subtitle">
            This policy explains how GoRent collects, uses, and protects your personal information.
          </p>
        </header>

        <section className="legal-container">
          <article className="legal-card">
            <h2>1. Information We Collect</h2>
            <ul className="legal-list">
              <li>Account details, such as name, email, and phone number.</li>
              <li>Booking details, including dates, vehicle selection, and billing data.</li>
              <li>Device and usage data used for security, analytics, and performance.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>2. How We Use Information</h2>
            <ul className="legal-list">
              <li>To create and manage bookings and customer accounts.</li>
              <li>To process transactions and provide support.</li>
              <li>To detect abuse, prevent fraud, and improve service reliability.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>3. Data Sharing</h2>
            <p>
              GoRent does not sell personal data. We may share limited information with trusted providers only when
              required for payments, operations, legal compliance, or platform functionality.
            </p>
          </article>

          <article className="legal-card">
            <h2>4. Security and Retention</h2>
            <p>
              We use technical and organizational safeguards to protect stored data. Information is retained only as
              long as necessary for service delivery, legal obligations, and dispute handling.
            </p>
          </article>

          <article className="legal-card">
            <h2>5. Your Rights</h2>
            <p>
              You can request account updates or data corrections by contacting
              {" "}
              <a href="mailto:privacy@gorent.com">privacy@gorent.com</a>.
            </p>
          </article>
        </section>

        <section className="legal-meta">
          <p>Last Updated: April 1, 2026</p>
          <p>Contact: privacy@gorent.com</p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
