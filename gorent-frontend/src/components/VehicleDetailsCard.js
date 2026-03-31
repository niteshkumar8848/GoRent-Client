import PropTypes from "prop-types";

function VehicleDetailsCard({ vehicle }) {
  if (!vehicle) return null;

  const seats = Number.isFinite(Number(vehicle.seats)) ? Number(vehicle.seats) : "N/A";
  const fuelType = vehicle.fuelType || vehicle.fuel_type || "N/A";
  const category = vehicle.category || "N/A";
  const ac = typeof vehicle.ac === "boolean" ? (vehicle.ac ? "AC" : "Non-AC") : "N/A";
  const luggageCapacity = vehicle.luggage_capacity || "N/A";

  return (
    <div className="vehicle-details-card">
      <h4 className="vehicle-details-title">Vehicle Details</h4>
      <div className="vehicle-details-grid">
        <p><strong>🪑 Seats:</strong> {seats}</p>
        <p><strong>⛽ Fuel Type:</strong> {fuelType}</p>
        <p><strong>🚗 Category:</strong> {category}</p>
        <p><strong>❄️ AC:</strong> {ac}</p>
        <p><strong>🧳 Luggage:</strong> {luggageCapacity}</p>
      </div>
    </div>
  );
}

VehicleDetailsCard.propTypes = {
  vehicle: PropTypes.shape({
    name: PropTypes.string,
    seats: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fuelType: PropTypes.string,
    fuel_type: PropTypes.string,
    category: PropTypes.string,
    ac: PropTypes.bool,
    luggage_capacity: PropTypes.string
  })
};

VehicleDetailsCard.defaultProps = {
  vehicle: null
};

export default VehicleDetailsCard;
