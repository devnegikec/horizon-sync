import * as React from 'react';

import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

// ⚠️ Must be imported at module level so Leaflet CSS is available before the map initialises
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import type { AnalyticsGeoPoint } from '../../types/qseal.types';

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Observes the map container for size changes (CSS transitions, flex layouts,
 * parent resizes) and tells Leaflet to reflow tiles accordingly.
 *
 * Using ResizeObserver is more reliable than setTimeout because it fires only
 * when the container actually gets its final dimensions — no guessing delay.
 */
function MapResizeHandler() {
  const map = useMap();

  React.useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    // Immediate first pass (container may already have dimensions)
    map.invalidateSize();

    // Watch for any subsequent size changes
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
}

function MapBoundsHandler({ points }: { points: AnalyticsGeoPoint[] }) {
  const map = useMap();

  React.useEffect(() => {
    const bounds = points
      .filter(
        (point) =>
          Number.isFinite(point.latitude) &&
          Number.isFinite(point.longitude) &&
          point.latitude >= -90 &&
          point.latitude <= 90 &&
          point.longitude >= -180 &&
          point.longitude <= 180,
      )
      .map((point) => [point.latitude, point.longitude] as [number, number]);
    if (bounds.length === 1) {
      map.setView(bounds[0], 11);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
    }
  }, [map, points]);

  return null;
}

interface AnalyticsMapProps {
  points: AnalyticsGeoPoint[];
  loading: boolean;
}

export function AnalyticsMap({ points, loading }: AnalyticsMapProps) {
  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3058EE] mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── No data ─────────────────────────────────────────────────────────
  if (!points.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] bg-muted/20 rounded-lg gap-2">
            <MapPin className="h-8 w-8 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No scan location data yet</p>
            <p className="text-xs text-muted-foreground">Locations will appear here once users start scanning QR codes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compute max count for circle radius scaling
  const maxCount = Math.max(...points.map((p) => p.count), 1);

  // ── Map with data ───────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
        <span className="text-xs text-muted-foreground ml-auto">{points.length} locations</span>
      </CardHeader>
      <CardContent className="p-0" style={{ minHeight: 400 }}>
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} className="w-full rounded-b-lg" style={{ height: 400, width: '100%' }}>
          <MapResizeHandler />
          <MapBoundsHandler points={points} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {points.map((p, i) => {
            if (p.latitude == null || p.longitude == null) return null;
            const radius = Math.max(6, Math.min((p.count / maxCount) * 28, 24));
            const label = [p.city, p.state, p.country].filter(Boolean).join(', ') || 'Unknown';

            return (
              <CircleMarker
                key={i}
                center={[p.latitude, p.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: '#3058EE',
                  fillOpacity: 0.55,
                  color: '#1E40AF',
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
                    <strong>{label}</strong>
                    <br />
                    <b>{p.count.toLocaleString()} scans</b>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
