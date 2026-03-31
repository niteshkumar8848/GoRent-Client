import { useMemo } from "react";
import PropTypes from "prop-types";
import { MapContainer, Marker, Popup, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import configureLeafletDefaultIcon from "../utils/leafletIcon";

configureLeafletDefaultIcon();

function VehicleAvailabilityMap({ userLocation, vehicles }) {
  const center = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) {
      return [userLocation.lat, userLocation.lng];
    }
    return [28.6139, 77.209];
  }, [userLocation]);

  const markers = useMemo(() => {
    const normalizedMarkers = [];
    vehicles
      .filter((vehicle) => vehicle.available)
      .forEach((vehicle) => {
        if (Array.isArray(vehicle.pickup_locations) && vehicle.pickup_locations.length > 0) {
          vehicle.pickup_locations.forEach((location, locationIndex) => {
            normalizedMarkers.push({
              key: `${vehicle._id}-${locationIndex}`,
              vehicle,
              marker: {
                lat: Number(location.lat),
                lng: Number(location.lng),
                name: location.name || "Pickup Location"
              }
            });
          });
        }
      });
    return normalizedMarkers;
  }, [vehicles]);

  return (
    <div className="vehicle-map-card">
      <div className="vehicle-map-header">
        <h3>Find Available Cars Near You</h3>
        <p>Real-time nearby pickup availability</p>
      </div>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="vehicle-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation?.lat && userLocation?.lng && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={10}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.7 }}
          >
            <Popup>Your current location</Popup>
          </CircleMarker>
        )}

        {markers.map((item) => (
          <Marker key={item.key} position={[item.marker.lat, item.marker.lng]}>
            <Popup>
              <div className="vehicle-map-popup">
                <strong>{item.vehicle.name || "Vehicle"}</strong>
                <p>Category: {item.vehicle.category || "N/A"}</p>
                <p>Price/Day: ₹{item.vehicle.pricePerDay || "N/A"}</p>
                <p>Availability: {item.vehicle.available ? "Available" : "Unavailable"}</p>
                <p>Pickup: {item.marker.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {markers.length === 0 && (
        <p className="pickup-helper-text">No available car markers found right now.</p>
      )}
    </div>
  );
}

VehicleAvailabilityMap.propTypes = {
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  vehicles: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      category: PropTypes.string,
      pricePerDay: PropTypes.number,
      available: PropTypes.bool,
      pickup_locations: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          lat: PropTypes.number,
          lng: PropTypes.number
        })
      )
    })
  )
};

VehicleAvailabilityMap.defaultProps = {
  userLocation: null,
  vehicles: []
};

export default VehicleAvailabilityMap;
