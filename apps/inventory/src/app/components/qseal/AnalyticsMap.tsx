import * as React from 'react';

import { MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import type { AnalyticsGeoPoint } from '../../types/qseal.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleMap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleCircle = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleLatLng = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleInfoWindow = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleLatLngBounds = any;

declare const google: {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMap;
    Circle: new (opts: Record<string, unknown>) => GoogleCircle;
    LatLng: new (lat: number, lng: number) => GoogleLatLng;
    LatLngBounds: new () => GoogleLatLngBounds;
    InfoWindow: new (opts: Record<string, unknown>) => GoogleInfoWindow;
  };
} | undefined;

interface AnalyticsMapProps {
  points: AnalyticsGeoPoint[];
  loading: boolean;
}

// Load Google Maps API script dynamically
function useGoogleMapsScript(apiKey: string): boolean {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    // Check if already loaded
    if (typeof google !== 'undefined' && google?.maps) {
      setLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      // Don't remove on cleanup — let other components reuse
    };
  }, [apiKey]);

  return loaded;
}

export function AnalyticsMap({ points, loading }: AnalyticsMapProps) {
  const apiKey = (typeof process !== 'undefined' && process.env?.NX_GOOGLE_MAPS_API_KEY) || '';
  const mapsLoaded = useGoogleMapsScript(apiKey);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = React.useState<GoogleMap | null>(null);
  const markersRef = React.useRef<GoogleCircle[]>([]);

  // Initialize map
  React.useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstance || typeof google === 'undefined' || !google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
        { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0e7ff' }] },
      ],
    });

    setMapInstance(map);
  }, [mapsLoaded, mapInstance]);

  // Update markers when points change
  React.useEffect(() => {
    if (!mapInstance || !points.length || typeof google === 'undefined' || !google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Fit bounds to all points
    const bounds = new google.maps.LatLngBounds();
    const maxCount = Math.max(...points.map((p) => p.count), 1);

    points.forEach((p) => {
      const latLng = new google.maps.LatLng(p.latitude, p.longitude);
      bounds.extend(latLng);

      const radius = Math.max(5, Math.min((p.count / maxCount) * 30, 25));

      const circle = new google.maps.Circle({
        center: latLng,
        radius: radius * 10000,
        fillColor: '#3058EE',
        fillOpacity: 0.5,
        strokeColor: '#1E40AF',
        strokeWeight: 1,
        map: mapInstance,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-family: sans-serif; padding: 4px;"><strong>${p.city ?? 'Unknown'}</strong>${p.state ? `, ${p.state}` : ''}, ${p.country}<br/><b>${p.count.toLocaleString()} scans</b></div>`,
      });

      circle.addListener('click', () => {
        infoWindow.open(mapInstance, circle);
      });

      markersRef.current.push(circle);
    });

    if (points.length > 0) {
      mapInstance.fitBounds(bounds, { top: 20, bottom: 20, left: 20, right: 20 });
    }
  }, [mapInstance, points]);

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

  if (!apiKey) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] bg-muted/20 rounded-lg gap-2">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Set <code className="bg-muted px-1 rounded">NX_GOOGLE_MAPS_API_KEY</code> to enable the map
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapsLoaded) {
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
              <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
