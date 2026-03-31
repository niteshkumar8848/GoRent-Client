const router = require("express").Router();
const axios = require("axios");

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_HEADERS = {
  "User-Agent": "GoRent-CarRental/1.0",
  Accept: "application/json"
};

router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter q is required" });
    }

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: query,
        format: "json",
        addressdetails: 1,
        limit: 5
      },
      headers: NOMINATIM_HEADERS,
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    console.error("Nominatim search error:", err.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch location suggestions"
    });
  }
});

router.get("/reverse", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ success: false, message: "lat and lon are required" });
    }

    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        lat,
        lon,
        format: "json",
        addressdetails: 1
      },
      headers: NOMINATIM_HEADERS,
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    console.error("Nominatim reverse error:", err.message);
    res.status(500).json({
      success: false,
      message: "Unable to reverse geocode location"
    });
  }
});

module.exports = router;
