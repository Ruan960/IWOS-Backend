const express = require("express");
const Reading = require("../models/Reading");

const router = express.Router();

function asNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normaliseReading(body = {}) {
  // Accept both our dashboard/backend format and the original Pi field names.
  const windMs = asNumber(body.wind_speed_ms);

  const reading = {
    deviceId: body.deviceId || body.device_id || "iwos-campus-01",
    source: body.source || (body.temperature_c !== undefined ? "raspberry-pi" : "api"),

    latitude: asNumber(body.latitude),
    longitude: asNumber(body.longitude),
    altitude: asNumber(body.altitude ?? body.altitude_m),

    lux: asNumber(body.lux),
    solarIrradiance: asNumber(body.solarIrradiance ?? body.solar_irradiance),

    temperature: asNumber(body.temperature ?? body.temperature_c),
    humidity: asNumber(body.humidity ?? body.humidity_pct),
    pressure: asNumber(body.pressure ?? body.pressure_hpa),

    rainDetected:
      typeof body.rainDetected === "boolean"
        ? body.rainDetected
        : typeof body.rain_detected === "boolean"
          ? body.rain_detected
          : undefined,

    windSpeed:
      asNumber(body.windSpeed) ?? (windMs !== undefined ? windMs * 3.6 : undefined),
    windDirection: asNumber(body.windDirection ?? body.wind_direction),

    timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
  };

  Object.keys(reading).forEach((key) => {
    if (reading[key] === undefined || Number.isNaN(reading[key])) delete reading[key];
  });

  return reading;
}

function requireIngestKey(req, res, next) {
  const expected = process.env.IWOS_INGEST_KEY;
  if (!expected) return next(); // quick/local mode: key is optional

  if (req.get("x-iwos-key") !== expected) {
    return res.status(401).json({ message: "Invalid IWOS ingest key" });
  }

  next();
}

// POST new sensor reading from Raspberry Pi or test client.
router.post("/", requireIngestKey, async (req, res) => {
  try {
    const normalised = normaliseReading(req.body);

    if (normalised.temperature === undefined &&
        normalised.humidity === undefined &&
        normalised.pressure === undefined &&
        normalised.windSpeed === undefined &&
        normalised.latitude === undefined) {
      return res.status(400).json({ message: "No recognised IWOS sensor fields supplied" });
    }

    const savedReading = await Reading.create(normalised);
    res.status(201).json(savedReading);
  } catch (error) {
    res.status(500).json({
      message: "Failed to save reading",
      error: error.message
    });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const query = req.query.deviceId ? { deviceId: req.query.deviceId } : {};
    const reading = await Reading.findOne(query).sort({ timestamp: -1 });

    if (!reading) return res.status(404).json({ message: "No readings found" });
    res.json(reading);
  } catch (error) {
    res.status(500).json({ message: "Failed to get latest reading", error: error.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
    const query = req.query.deviceId ? { deviceId: req.query.deviceId } : {};
    const readings = await Reading.find(query).sort({ timestamp: -1 }).limit(limit);
    res.json(readings);
  } catch (error) {
    res.status(500).json({ message: "Failed to get reading history", error: error.message });
  }
});

module.exports = router;
