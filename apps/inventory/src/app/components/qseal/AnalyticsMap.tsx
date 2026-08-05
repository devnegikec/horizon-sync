import * as React from 'react';

import { MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import type { AnalyticsGeoPoint } from '../../types/qseal.types';

// ══════════════════════════════════════════════════════════════════════════════
// Leaflet via CDN — free, no API key, OpenStreetMap tiles
// ══════════════════════════════════════════════════════════════════════════════

interface AnalyticsMapProps {
  points: AnalyticsGeoPoint[];
  loading: boolean;
}

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

/** Access Leaflet global — set by CDN script. */
function getL() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).L as Record<string, any> | undefined;
}

/** Dynamically load Leaflet CSS + JS from CDN. */
function useLeafletScript(): boolean {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    // Check if already available from a previous load
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (window as any).L;
    if (existing) { setLoaded(true); return; }

    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.onerror = () => console.error('Leaflet CSS failed to load');
      document.head.appendChild(link);
    }

    // Load JS (avoid duplicates)
    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      // Script already in DOM — check periodically if L is available
      let attempts = 0;
      const interval = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).L) { setLoaded(true); clearInterval(interval); }
        if (++attempts > 50) clearInterval(interval); // timeout after 5s
      }, 100);
      return () => clearInterval(interval);
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error('Leaflet CDN failed to load — check network');
    document.head.appendChild(script);
  }, []);

  return loaded;
}

export function AnalyticsMap({ points, loading }: AnalyticsMapProps) {
  const leafletLoaded = useLeafletScript();
  const [cdsFailed, setCdsFailed] = React.useState(false);
  const mapRef = React.useRef<HTMLDivElement>(null);

  // Timeout: if Leaflet doesn't load within 10s, show fallback
  React.useEffect(() => {
    if (leafletLoaded) return;
    const timer = setTimeout(() => setCdsFailed(true), 10000);
    return () => clearTimeout(timer);
  }, [leafletLoaded]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = React.useRef<any>(null);
  const initRef = React.useRef(false);

  // Initialize map once
  React.useEffect(() => {
    const L = getL();
    if (!leafletLoaded || !mapRef.current || initRef.current || !L) return;
    initRef.current = true;

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

    // Force size recalculation after init
    setTimeout(() => map.invalidateSize(), 100);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapInstanceRef.current = null;
      initRef.current = false;
    };
  }, [leafletLoaded]);

  // Update markers when points change
  React.useEffect(() => {
    const L = getL();
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !points.length || !L) return;

    layer.clearLayers();
    const maxCount = Math.max(...points.map((p) => p.count), 1);

    points.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      const radius = Math.max(6, Math.min((p.count / maxCount) * 28, 24));
      const locationLabel = [p.city, p.state, p.country].filter(Boolean).join(', ') || 'Unknown';

      const marker = L.circleMarker([p.latitude, p.longitude], {
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

    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds);
      map.invalidateSize();
    } catch { /* ignore */ }
  }, [points, leafletLoaded]);

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

  // ── Map with data (always render div, Leaflet init handles timing) ──
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
        <span className="text-xs text-muted-foreground ml-auto">{points.length} locations</span>
      </CardHeader>
      <CardContent className="p-0">
        {cdsFailed ? (
          <div className="flex flex-col items-center justify-center h-[400px] bg-muted/20 rounded-b-lg gap-2 text-muted-foreground text-sm p-4">
            <MapPin className="h-8 w-8 opacity-30" />
            <p>Map library failed to load. Check your network.</p>
            <div className="mt-2 text-xs max-h-[300px] overflow-auto w-full">
              {points.map((p, i) => (
                <div key={i} className="flex justify-between py-1 px-2 border-b border-muted">
                  <span>{p.city || p.country || 'Unknown'}</span>
                  <span className="font-mono">{p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}</span>
                  <span className="font-medium">{p.count} scans</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="h-[400px] w-full rounded-b-lg bg-muted/20" />
        )}
      </CardContent>
    </Card>
  );
}
