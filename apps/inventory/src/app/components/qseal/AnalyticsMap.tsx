import * as React from 'react';

import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import type { AnalyticsGeoPoint } from '../../types/qseal.types';

interface AnalyticsMapProps {
  points: AnalyticsGeoPoint[];
  loading: boolean;
}

export function AnalyticsMap({ points, loading }: AnalyticsMapProps) {
  console.log('AnalyticsMap points:', points);
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
      <CardContent className="p-0">
        <MapContainer center={[20, 0]}
          zoom={2}
          scrollWheelZoom={true}
          className="h-[400px] w-full rounded-b-lg" >
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {points.map((p, i) => {
            if (p.latitude == null || p.longitude == null) return null;
            const radius = Math.max(6, Math.min((p.count / maxCount) * 28, 24));
            const label = [p.city, p.state, p.country].filter(Boolean).join(', ') || 'Unknown';

            return (
              <CircleMarker key={i}
                center={[p.latitude, p.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: '#3058EE',
                  fillOpacity: 0.55,
                  color: '#1E40AF',
                  weight: 1.5,
                }}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
                    <strong>{label}</strong><br />
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
