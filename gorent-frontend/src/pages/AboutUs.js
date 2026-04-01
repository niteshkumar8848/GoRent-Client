function AboutUs() {
  return (
    <div className="page">
      <div className="container">
        <header className="page-header legal-header">
          <h1 className="page-title">About Us</h1>
          <p className="page-subtitle">
            Building reliable, transparent, and hassle-free mobility for everyday travel.
          </p>
        </header>

        <section className="legal-container">
          <article className="legal-card">
            <h2>Who We Are</h2>
            <p>
              GoRent is a digital vehicle rental platform focused on safe, dependable, and clear booking
              experiences. We help renters compare verified vehicles, understand total costs, and book in minutes.
            </p>
          </article>

          <article className="legal-card">
            <h2>Our Mission</h2>
            <p>
              Our mission is to simplify mobility with transparent pricing, trusted listings, and responsive support
              across every stage of the rental journey.
            </p>
          </article>

          <article className="legal-card">
            <h2>What We Value</h2>
            <ul className="legal-list">
              <li>Clear pricing and booking details before payment.</li>
              <li>Reliable service with verified vehicle information.</li>
              <li>Fast issue resolution through dedicated customer support.</li>
              <li>Continuous platform improvements based on user feedback.</li>
            </ul>
          </article>

          <article className="legal-card legal-highlight">
            <p>
              GoRent is designed for both renters and admins, with real-time booking visibility, secure account flows,
              and location-aware features that make planning trips easier.
            </p>
          </article>
        </section>

        <section className="legal-meta">
          <p>Company: GoRent</p>
          <p>Version: Production Web Platform</p>
        </section>
      </div>
    </div>
  );
}

export default AboutUs;
