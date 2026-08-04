# React: Scan Location Map Implementation Guide

This document describes how to replicate the Django app's scan-location mapping setup in a React application — using **Leaflet + OpenStreetMap** (free, no API key) for rendering and **Nominatim** for reverse geocoding.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dependencies](#dependencies)
3. [Backend Setup](#backend-setup)
4. [React: Location Capture Hook](#react-location-capture-hook)
5. [React: Map Component](#react-map-component)
6. [React: Dashboard Page](#react-dashboard-page)
7. [CSS Styles](#css-styles)
8. [Putting It All Together](#putting-it-all-together)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    USER SCANS QR                      │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│  useGeolocation() hook                               │
│  • Browser GPS (navigator.geolocation)               │
│  • Accuracy threshold: 100m (excellent) / 500m (max) │
│  • Fallback → server-side IP resolution              │
└──────────────────────────────────────────────────────┘
                         │
                         ▼  POST /api/analytics/scan/
┌──────────────────────────────────────────────────────┐
│  Backend API                                         │
│  • Store {lat, lon, source, device_id, event_type}   │
│  • Reverse geocode via Nominatim (if needed)         │
│  • Return visitor_locations[] for map                │
└──────────────────────────────────────────────────────┘
                         │
                         ▼  GET /api/analytics/scans/
┌──────────────────────────────────────────────────────┐
│  <ScanMap /> component                               │
│  • Leaflet map with OpenStreetMap tiles              │
│  • MarkerClusterGroup for dense points               │
│  • Heatmap layer toggle                              │
│  • Custom pulse markers for suspicious scans         │
└──────────────────────────────────────────────────────┘
```

**Key difference from Google Maps:** Zero API keys, zero cost, fully open-source.

---

## Dependencies

```bash
npm install leaflet react-leaflet leaflet.markercluster leaflet-heat
npm install -D @types/leaflet
```

| Package | Purpose |
|---------|---------|
| `leaflet` | Core map library |
| `react-leaflet` | React bindings for Leaflet |
| `leaflet.markercluster` | Clusters nearby markers at low zoom |
| `leaflet-heat` | Heatmap overlay |

---

## Backend Setup

Your backend needs two endpoints:

### 1. Receive Scan Events

```
POST /api/analytics/scan/
```

**Request body:**

```json
{
  "event_id": "uuid-v4",
  "event_type": "Scan_ProductName",
  "product_name": "WidgetX",
  "serial_number": "SN-2024-001",
  "auth_status": true,
  "device_id": "uuid-v4",
  "latitude": "28.6139",
  "longitude": "77.2090",
  "accuracy": "15",
  "location_source": "GPS"
}
```

When the client cannot get GPS, send `location_source: "IP"` with empty lat/lon — the backend resolves the IP server-side.

### 2. Serve Scan Locations for the Map

```
GET /api/analytics/scans/?start_date=2024-01-01&end_date=2024-01-31
```

**Response shape:**

```json
{
  "total_visits": 1523,
  "suspicious_scans": 12,
  "visitor_locations": [
    {
      "latitude": "28.6139",
      "longitude": "77.2090",
      "city": "New Delhi",
      "region": "Delhi",
      "country": "India",
      "count": 45,
      "suspicious_count": 2,
      "location_source": "GPS"
    }
  ],
  "visits_over_time": {
    "2024-01-01": 52,
    "2024-01-02": 48
  }
}
```

### Backend Reverse Geocoding (Python/Django reference)

```python
import requests
import time

_location_cache = {}

def reverse_geocode(lat, lon):
    """Resolve lat/lon → city/region/country via Nominatim (free, rate-limited)."""
    key = f"{lat}_{lon}"
    if key in _location_cache:
        return _location_cache[key]

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json"},
            headers={"User-Agent": "YourApp/1.0 (contact@yourdomain.com)"},
            timeout=10,
        )
        if resp.status_code == 200:
            addr = resp.json().get("address", {})
            result = {
                "city": addr.get("city") or addr.get("town") or addr.get("village"),
                "region": addr.get("state"),
                "country": addr.get("country"),
            }
            _location_cache[key] = result
            time.sleep(1)  # Nominatim allows ~1 req/sec
            return result
    except Exception:
        pass
    return None
```

> **Important:** Nominatim's usage policy requires a unique `User-Agent` header and max 1 request/second. For production at scale, consider self-hosting Nominatim or using a paid geocoding service.

---

## React: Location Capture Hook

Create `useGeolocation.js`:

```jsx
import { useCallback, useRef } from 'react';

/**
 * Generates a UUID v4 (no external dependency needed).
 */
function uuidv4() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable anonymous device ID from localStorage.
 */
function getDeviceId() {
  let id = localStorage.getItem('scanDeviceId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('scanDeviceId', id);
  }
  return id;
}

const ANALYTICS_ENDPOINT = '/api/analytics/scan/';

export default function useGeolocation() {
  const sentRef = useRef(false);

  const captureAndSend = useCallback(
    ({ productName, serialNumber, authStatus }) => {
      if (sentRef.current) return;
      sentRef.current = true;

      const payload = {
        event_id: uuidv4(),
        event_type: authStatus
          ? `Scan_${productName}`
          : `Authentication_Fail_${productName}`,
        product_name: productName,
        serial_number: serialNumber,
        auth_status: authStatus,
        device_id: getDeviceId(),
      };

      const sendEvent = (locData) => {
        fetch(ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, ...locData }),
        }).catch(() => {
          sentRef.current = false; // allow retry on next scan
        });
      };

      // ---- GPS attempt ----
      if (!navigator.geolocation) {
        sendEvent({ location_source: 'IP' });
        return;
      }

      let bestAccuracy = Infinity;
      let bestPosition = null;

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
            bestPosition = pos;
          }
          // Accept immediately if accuracy <= 100m
          if (accuracy <= 100) {
            navigator.geolocation.clearWatch(watchId);
            sendEvent({
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6),
              accuracy: Math.round(accuracy),
              location_source: 'GPS',
            });
          }
        },
        () => {
          navigator.geolocation.clearWatch(watchId);
          sendEvent({ location_source: 'IP' });
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
      );

      // Fallback after 10 seconds
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (bestPosition) {
          const { latitude, longitude, accuracy } = bestPosition.coords;
          if (accuracy > 500) {
            // Accuracy too poor — let the server resolve via IP
            sendEvent({ location_source: 'IP' });
          } else {
            sendEvent({
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6),
              accuracy: Math.round(accuracy),
              location_source: 'WIFI',
            });
          }
        } else {
          sendEvent({ location_source: 'IP' });
        }
      }, 10000);
    },
    []
  );

  return { captureAndSend };
}
```

---

## React: Map Component

Create `ScanMap.jsx`:

```jsx
import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-heat';

/**
 * Scan location map with marker clustering + heatmap toggle.
 *
 * Props:
 *   locations: Array<{
 *     latitude: string,
 *     longitude: string,
 *     city?: string,
 *     region?: string,
 *     country?: string,
 *     count?: number,
 *     suspicious_count?: number,
 *   }>
 */
export default function ScanMap({ locations = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersCluster = useRef(null);
  const heatLayer = useRef(null);

  // ---- Init map once ----
  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      worldCopyJump: false,
      minZoom: 2,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 1.0,
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      noWrap: true,
    }).addTo(map);

    // Marker cluster layer
    markersCluster.current = L.markerClusterGroup({
      maxClusterRadius: 40,
      showCoverageOnHover: false,
    });
    map.addLayer(markersCluster.current);

    // Heatmap layer
    heatLayer.current = L.heatLayer([], {
      radius: 25,
      blur: 15,
      maxZoom: 6,
    }).addTo(map);

    // Layer toggle control
    L.control
      .layers(
        {},
        {
          'Scan Markers': markersCluster.current,
          'Scan Heatmap': heatLayer.current,
        }
      )
      .addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ---- Update markers when locations change ----
  useEffect(() => {
    if (!markersCluster.current || !heatLayer.current) return;

    const cluster = markersCluster.current;
    cluster.clearLayers();

    const heatPoints = [];

    locations.forEach((loc) => {
      const lat = parseFloat(loc.latitude);
      const lon = parseFloat(loc.longitude);
      if (isNaN(lat) || isNaN(lon)) return;

      const isSuspicious = (loc.suspicious_count || 0) > 0;
      const locationLabel = [loc.city, loc.region, loc.country]
        .filter(Boolean)
        .join(', ') || 'Unknown';

      // Create marker with custom pulse icon
      const icon = L.divIcon({
        className: '',
        html: `<div class="pulse-marker${isSuspicious ? ' suspicious' : ''}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([lat, lon], { icon });
      marker.bindPopup(`
        <strong>${locationLabel}</strong><br/>
        Scans: ${loc.count || 1}<br/>
        ${isSuspicious ? `⚠️ Suspicious: ${loc.suspicious_count}` : ''}
      `);
      cluster.addLayer(marker);

      // Heat point (intensity = count)
      heatPoints.push([lat, lon, loc.count || 1]);
    });

    heatLayer.current.setLatLngs(heatPoints);

    // Auto-fit bounds if there are markers
    if (locations.length > 0) {
      const bounds = cluster.getBounds();
      if (bounds.isValid()) {
        mapInstance.current?.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  }, [locations]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}
```

---

## React: Dashboard Page

Create `ScanDashboard.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react';
import ScanMap from './ScanMap';

const API_BASE = '/api/analytics/scans';

export default function ScanDashboard() {
  const [locations, setLocations] = useState([]);
  const [metrics, setMetrics] = useState({
    totalVisits: 0,
    suspiciousScans: 0,
    uniqueVisitors: 0,
    totalActions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last7');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate = new Date();
          break;
        case 'yesterday':
          startDate.setDate(today.getDate() - 1);
          break;
        case 'last7':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'last30':
          startDate.setDate(today.getDate() - 30);
          break;
        default:
          break;
      }

      const fmt = (d) => d.toISOString().split('T')[0];
      const url = `${API_BASE}?start_date=${fmt(startDate)}&end_date=${fmt(today)}`;

      const res = await fetch(url);
      const data = await res.json();

      setLocations(data.visitor_locations || []);
      setMetrics({
        totalVisits: data.total_visits || 0,
        suspiciousScans: data.suspicious_scans || 0,
        uniqueVisitors: data.total_unique_visitors || 0,
        totalActions: data.total_actions || 0,
      });
    } catch (err) {
      console.error('Failed to fetch scan data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="dashboard">
      {/* Metrics row */}
      <div className="metrics-row">
        <MetricCard icon="⏱️" value={metrics.totalVisits} label="Total Scans" />
        <MetricCard icon="👤" value={metrics.uniqueVisitors} label="Unique Visitors" />
        <MetricCard icon="⚡" value={metrics.totalActions} label="Total Actions" />
        <MetricCard icon="🛡️" value={metrics.suspiciousScans} label="Suspicious" />
      </div>

      {/* Date filter */}
      <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last7">Last 7 Days</option>
        <option value="last30">Last 30 Days</option>
      </select>

      {/* Map */}
      <div className="map-container">
        {loading ? (
          <div className="loading">Loading scan locations...</div>
        ) : (
          <ScanMap locations={locations} />
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, value, label }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
```

---

## CSS Styles

Add these styles to your global CSS or a CSS module:

```css
/* ---- Map Container ---- */
.map-container {
  height: 450px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* ---- Pulse Marker (for scan points) ---- */
.pulse-marker {
  width: 16px;
  height: 16px;
  background: #4285f4;
  border-radius: 50%;
  position: relative;
}

.pulse-marker.suspicious {
  background: #c62828;
}

.pulse-marker::after {
  content: '';
  width: 16px;
  height: 16px;
  background: rgba(66, 133, 244, 0.4);
  border-radius: 50%;
  position: absolute;
  left: 0;
  top: 0;
  animation: pulse 1.5s infinite;
}

.pulse-marker.suspicious::after {
  background: rgba(198, 40, 40, 0.45);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.9;
  }
  70% {
    transform: scale(3);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* ---- Metrics Row ---- */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: white;
  text-align: center;
  padding: 24px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
}

.metric-label {
  font-size: 14px;
  opacity: 0.85;
}

/* ---- Loading ---- */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 16px;
}
```

---

## Putting It All Together

### File structure

```
src/
├── hooks/
│   └── useGeolocation.js       # GPS capture + analytics send
├── components/
│   ├── ScanMap.jsx             # Leaflet map with clustering + heatmap
│   └── ScanDashboard.jsx       # Dashboard page (metrics + map)
└── App.jsx                     # Entry point
```

### Entry point usage

```jsx
// App.jsx
import ScanDashboard from './components/ScanDashboard';

function App() {
  return (
    <div className="App">
      <ScanDashboard />
    </div>
  );
}
```

### On the scan/consumer page (where QR is scanned):

```jsx
import useGeolocation from './hooks/useGeolocation';

function QrScanPage({ productName, serialNumber, authStatus }) {
  const { captureAndSend } = useGeolocation();

  useEffect(() => {
    captureAndSend({ productName, serialNumber, authStatus });
  }, []);

  return <div>{/* your QR scan UI */}</div>;
}
```

---

## Summary

| Concern | Technology Used | Cost |
|---------|----------------|------|
| Map tiles | OpenStreetMap | Free |
| Map rendering | Leaflet + react-leaflet | Free |
| Marker clustering | leaflet.markercluster | Free |
| Heatmap | leaflet-heat | Free |
| Reverse geocoding | Nominatim (OSM) | Free (1 req/s) |
| GPS capture | Browser Geolocation API | Free |
| IP fallback | Server-side (ipinfo.io or similar) | Free tier available |

**No Google Maps API key is needed at any point.** The entire stack is open-source and free to use, with the only constraint being Nominatim's 1 request/second rate limit (which is fine for moderate traffic; self-host or use a paid service for high volume).
