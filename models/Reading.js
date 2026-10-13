const mongoose = require("mongoose");

const readingSchema = new mongoose.Schema(
  {
    deviceId: { type: String, default: "iwos-campus-01", index: true },
    source: { type: String, default: "api" },

    latitude: Number,
    longitude: Number,
    altitude: Number,

    lux: Number,
    solarIrradiance: Number,

    temperature: Number,
    humidity: Number,
    pressure: Number,

    rainDetected: Boolean,
    windSpeed: Number,
    windDirection: Number,

    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reading", readingSchema);
