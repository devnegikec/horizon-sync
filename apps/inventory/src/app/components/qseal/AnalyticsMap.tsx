import * as React from 'react';

import { MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import type { AnalyticsGeoPoint } from '../../types/qseal.types';

// ══════════════════════════════════════════════════════════════════════════════
// Leaflet CDN loader (free, no API key — OpenStreetMap tiles)
// ══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any;

declare const L: {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
  circleMarker: (latlng: [number, number], opts?: Record<string, unknown>) => { bindPopup: (html: string) => void };
  featureGroup: () => { getBounds: () => { isValid: () => boolean }; addTo: (m: LeafletMap) => void; addLayer: (layer: unknown) => void; clearLayers: () => void };
} | undefined;

interface AnalyticsMapProps {
  points: AnalyticsGeoPoint[];
  loading: boolean;
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

/** Dynamically load Leaflet CSS + JS from CDN. No API key needed. */
function useLeafletScript(): boolean {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof L !== 'undefined') {
      setLoaded(true);
      return;
    }

    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Load JS
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error('Failed to load Leaflet');
    document.head.appendChild(script);
  }, []);

  return loaded;
}

export function AnalyticsMap({ points, loading }: AnalyticsMapProps) {
  const leafletLoaded = useLeafletScript();
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<LeafletMap | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = React.useRef<any>(null);

  // Initialize map once
  React.useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current || typeof L === 'undefined') return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.featureGroup().addTo(map);

    // Fix leaflet tiles on resize
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  // Update markers when points change
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !points.length || typeof L === 'undefined') return;

    layer.clearLayers();
    const maxCount = Math.max(...points.map((p) => p.count), 1);

    points.forEach((p) => {
      const lat = p.latitude;
      const lng = p.longitude;
      if (lat == null || lng == null) return;

      const radius = Math.max(6, Math.min((p.count / maxCount) * 28, 24));
      const locationLabel = [p.city, p.state, p.country].filter(Boolean).join(', ') || 'Unknown';

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor: '#3058EE',
        fillOpacity: 0.55,
        color: '#1E40AF',
        weight: 1.5,
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px;">
          <strong>${locationLabel}</strong><br/>
          <b>${p.count.toLocaleString()} scans</b>
        </div>
      `);

      layer.addLayer(marker);
    });

    // Auto-fit bounds
    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
      }
    } catch { /* ignore bounds errors */ }
  }, [points]);

  // ── Loading state ──────────────────────────────────────────────────
  if (loading || !leafletLoaded) {
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

  // ── Map with data ───────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
        <span className="text-xs text-muted-foreground ml-auto">{points.length} locations</span>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapRef} className="h-[400px] w-full rounded-b-lg" />
      </CardContent>
    </Card>
  );
}
