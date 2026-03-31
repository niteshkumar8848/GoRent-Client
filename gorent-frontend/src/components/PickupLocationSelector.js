import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import configureLeafletDefaultIcon from "../utils/leafletIcon";

configureLeafletDefaultIcon();

const getApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;
  if (window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }
  return `${window.location.protocol}//${window.location.host}/api`;
};

const API_URL = getApiUrl();

function DraggablePickupMarker({ position, onDrop }) {
  const [markerPosition, setMarkerPosition] = useState(position);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  useMapEvents({
    click(event) {
      const clickedPosition = [event.latlng.lat, event.latlng.lng];
      setMarkerPosition(clickedPosition);
      onDrop(clickedPosition);
    }
  });

  return (
    <Marker
      draggable
      position={markerPosition}
      eventHandlers={{
        dragend: (event) => {
          const latlng = event.target.getLatLng();
          const droppedPosition = [latlng.lat, latlng.lng];
          setMarkerPosition(droppedPosition);
          onDrop(droppedPosition);
        }
      }}
    />
  );
}

DraggablePickupMarker.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onDrop: PropTypes.func.isRequired
};

function PickupLocationSelector({ value, onChange }) {
  const [mode, setMode] = useState("text");
  const [query, setQuery] = useState(value?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [error, setError] = useState("");

  const mapCenter = useMemo(() => {
    if (value?.lat && value?.lng) {
      return [value.lat, value.lng];
    }
    return [28.6139, 77.209];
  }, [value]);

  useEffect(() => {
    setQuery(value?.address || "");
  }, [value?.address]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (mode !== "text" || trimmedQuery.length < 3) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        setError("");

        const response = await axios.get(`${API_URL}/location/search`, {
          params: { q: trimmedQuery },
          signal: controller.signal,
          timeout: 10000
        });

        setSuggestions(response.data?.data || []);
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setError("Unable to fetch address suggestions. Please try again.");
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [mode, query]);

  const selectSuggestion = (suggestion) => {
    const lat = Number(suggestion.lat);
    const lng = Number(suggestion.lon);

    onChange({
      address: suggestion.display_name || "N/A",
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null
    });

    setQuery(suggestion.display_name || "");
    setSuggestions([]);
    setError("");
  };

  const reverseGeocode = async (position) => {
    const [lat, lng] = position;

    try {
      setMapLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/location/reverse`, {
        params: { lat, lon: lng },
        timeout: 10000
      });

      const address = response.data?.data?.display_name || "Selected location";
      onChange({
        address,
        lat,
        lng
      });
    } catch (err) {
      setError("Unable to detect address for this pin location. Please try another spot.");
      onChange({
        address: "Selected location",
        lat,
        lng
      });
    } finally {
      setMapLoading(false);
    }
  };

  return (
    <div className="pickup-selector-card">
      <div className="pickup-selector-header">
        <h4>Pickup Location</h4>
        <div className="pickup-mode-toggle">
          <button
            type="button"
            className={`btn btn-sm ${mode === "text" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMode("text")}
          >
            Text Mode
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === "map" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMode("map")}
          >
            Map Mode
          </button>
        </div>
      </div>

      {mode === "text" && (
        <div className="pickup-text-mode">
          <input
            type="text"
            className="form-input"
            placeholder="Search pickup address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {loadingSuggestions && <p className="pickup-helper-text">Loading suggestions...</p>}
          {!loadingSuggestions && query.trim().length >= 3 && suggestions.length === 0 && (
            <p className="pickup-helper-text">No results found. Try another keyword.</p>
          )}

          {suggestions.length > 0 && (
            <div className="pickup-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={`${suggestion.place_id}-${suggestion.lat}`}
                  className="pickup-suggestion-item"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "map" && (
        <div className="pickup-map-mode">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="pickup-map-canvas">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggablePickupMarker position={mapCenter} onDrop={reverseGeocode} />
          </MapContainer>
          {mapLoading && <p className="pickup-helper-text">Detecting address from map pin...</p>}
        </div>
      )}

      {error && <div className="alert alert-error mt-1">{error}</div>}
      {value?.address && <p className="pickup-confirm-text">📍 Pickup set: {value.address}</p>}
    </div>
  );
}

PickupLocationSelector.propTypes = {
  value: PropTypes.shape({
    address: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  onChange: PropTypes.func.isRequired
};

PickupLocationSelector.defaultProps = {
  value: {
    address: "",
    lat: null,
    lng: null
  }
};

export default PickupLocationSelector;
