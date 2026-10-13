# IWOS Backend — Direct Raspberry Pi Version

This is the backend for the direct Pi -> IWOS API setup. AWS IoT is not required.

## Flow

Raspberry Pi sensors -> POST `/api/readings` -> MongoDB -> Dashboard GET `/latest` and `/history`

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and insert your MongoDB URI.

```bash
npm run dev
```

Local test URL:

```text
http://localhost:5000/api/readings
```

The endpoint accepts either the normal IWOS field names or the original Pi names such as `temperature_c`, `humidity_pct`, `pressure_hpa` and `wind_speed_ms`.

If `IWOS_INGEST_KEY` is set, the Pi must send the same value in the `x-iwos-key` header.
