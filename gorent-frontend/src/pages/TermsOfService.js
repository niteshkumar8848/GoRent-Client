function TermsOfService() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-subtitle">Terms and conditions for using GoRent.</p>
        </div>

        <div className="settings-card">
          <p><strong>Eligibility:</strong> Users must provide accurate information during registration and booking.</p>
          <p className="mt-1"><strong>Bookings:</strong> Rental dates, pricing, and vehicle availability are subject to confirmation.</p>
          <p className="mt-1"><strong>Payments & Cancellations:</strong> Charges and refunds follow the booking terms shown at checkout.</p>
          <p className="mt-1"><strong>Prohibited Use:</strong> Misuse, fraud, or unauthorized actions may result in account restrictions.</p>
          <p className="mt-2">By using GoRent, you agree to comply with these terms.</p>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
