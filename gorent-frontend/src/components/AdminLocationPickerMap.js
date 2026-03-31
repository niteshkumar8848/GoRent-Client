import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import configureLeafletDefaultIcon from "../utils/leafletIcon";

configureLeafletDefaultIcon();

function DraggableMapMarker({ position, onPositionChange }) {
  const [markerPosition, setMarkerPosition] = useState(position);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  useMapEvents({
    click(event) {
      const nextPosition = [event.latlng.lat, event.latlng.lng];
      setMarkerPosition(nextPosition);
      onPositionChange(nextPosition);
    }
  });

  return (
    <Marker
      position={markerPosition}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const latlng = event.target.getLatLng();
          const nextPosition = [latlng.lat, latlng.lng];
          setMarkerPosition(nextPosition);
          onPositionChange(nextPosition);
        }
      }}
    />
  );
}

DraggableMapMarker.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onPositionChange: PropTypes.func.isRequired
};

function AdminLocationPickerMap({ initialPosition, onConfirm, onCancel }) {
  const [selectedPosition, setSelectedPosition] = useState(initialPosition);

  const center = useMemo(() => selectedPosition || [28.6139, 77.209], [selectedPosition]);

  return (
    <div className="admin-location-picker">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="admin-location-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMapMarker position={center} onPositionChange={setSelectedPosition} />
      </MapContainer>

      <p className="pickup-helper-text">
        Selected: {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
      </p>

      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onConfirm(selectedPosition)}
        >
          Use This Location
        </button>
      </div>
    </div>
  );
}

AdminLocationPickerMap.propTypes = {
  initialPosition: PropTypes.arrayOf(PropTypes.number),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

AdminLocationPickerMap.defaultProps = {
  initialPosition: [28.6139, 77.209]
};

export default AdminLocationPickerMap;
