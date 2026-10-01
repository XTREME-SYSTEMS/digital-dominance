import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getGeoCoords } from '@/lib/geoCoords';

export default function ScanMap({ geos }) {
  const markers = geos
    .map(geo => {
      const coords = getGeoCoords(geo.geo_name, geo.state_code, geo.geo_type);
      if (!coords) return null;
      return { ...geo, coords };
    })
    .filter(Boolean);

  const complete = markers.filter(g => g.scan_status === 'complete').length;
  const pending = markers.filter(g => g.scan_status === 'pending').length;
  const failed = markers.filter(g => g.scan_status === 'failed').length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Scanned ({complete})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Pending ({pending})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Failed ({failed})
        </span>
      </div>
      <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden border border-stone-200">
        <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          {markers.map((geo, i) => {
            const color = geo.scan_status === 'complete' ? '#10B981' : geo.scan_status === 'pending' ? '#F59E0B' : '#EF4444';
            return (
              <CircleMarker
                key={i}
                center={geo.coords}
                radius={geo.geo_type === 'state' ? 10 : 7}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <strong style={{ fontSize: '14px' }}>{geo.geo_name}, {geo.state_code}</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>Type: {geo.geo_type}</span>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>Status: {geo.scan_status}</span>
                    <br />
                    {geo.market_score > 0 && (
                      <>
                        <span style={{ fontSize: '12px', color: '#666' }}>Market Score: {geo.market_score}</span>
                        <br />
                      </>
                    )}
                    {geo.available_domains?.length > 0 && (
                      <span style={{ fontSize: '12px', color: '#10B981' }}>
                        {geo.available_domains.length} domains available
                      </span>
                    )}
                    {geo.businesses?.length > 0 && (
                      <>
                        <br />
                        <span style={{ fontSize: '12px', color: '#3B82F6' }}>
                          {geo.businesses.length} businesses found
                        </span>
                      </>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      {markers.length < geos.length && (
        <p className="text-xs text-stone-400 mt-2">
          Showing {markers.length} of {geos.length} geographies on map ({geos.length - markers.length} without coordinates)
        </p>
      )}
    </div>
  );
}