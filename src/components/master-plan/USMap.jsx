import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const US_CENTER = [39.5, -98.35];

import { US_CITIES } from "@/lib/usCities";

const cityCoords = new Map();
US_CITIES.forEach((c) => {
  cityCoords.set(`${c.city.toLowerCase()}|${c.state.toLowerCase()}`, { lat: c.lat, lng: c.lng });
});

function lookupCoords(city, state) {
  if (!city) return null;
  const key = `${city.toLowerCase()}|${(state || "").toLowerCase()}`;
  const found = cityCoords.get(key);
  if (found) return found;
  for (const [k, v] of cityCoords) {
    if (k.startsWith(city.toLowerCase() + "|")) return v;
  }
  return null;
}

const starIcon = L.divIcon({
  className: "mp-star-marker",
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,#00a2ff 0%,#0066cc 60%,transparent 100%);opacity:0.4;animation:mp-pulse 2s ease-in-out infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;line-height:1;filter:drop-shadow(0 0 4px #00a2ff);">⭐</div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const liveIcon = L.divIcon({
  className: "mp-live-marker",
  html: `<div style="position:relative;width:32px;height:32px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,#22c55e 0%,#16a34a 60%,transparent 100%);opacity:0.5;animation:mp-pulse 1.5s ease-in-out infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;line-height:1;filter:drop-shadow(0 0 6px #22c55e);">💻</div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const queuedIcon = L.divIcon({
  className: "mp-queued-marker",
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,#f59e0b 0%,#d97706 60%,transparent 100%);opacity:0.35;animation:mp-pulse 3s ease-in-out infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:12px;line-height:1;filter:drop-shadow(0 0 3px #f59e0b);">✦</div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

function FitBounds({ sites }) {
  const map = useMap();
  useEffect(() => {
    if (sites.length === 0) return;
    if (sites.length === 1) {
      map.setView([sites[0].lat, sites[0].lng], 6);
      return;
    }
    const bounds = L.latLngBounds(sites.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [sites, map]);
  return null;
}

export default function USMap({ sites }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mappedSites = useMemo(() => {
    return sites
      .map((s) => {
        const coords = lookupCoords(s.target_city, s.target_state);
        if (!coords) return null;
        return { ...s, lat: coords.lat, lng: coords.lng };
      })
      .filter(Boolean);
  }, [sites]);

  if (!mounted) return <div style={{ height: 500 }} />;

  return (
    <div style={{ height: 520, borderRadius: 12, overflow: "hidden", border: "1px solid #dce6f1" }}>
      <MapContainer
        center={US_CENTER}
        zoom={4}
        style={{ height: "100%", width: "100%", background: "#02021a" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <FitBounds sites={mappedSites} />
        {mappedSites.map((s, i) => (
          <Marker
            key={s.id || i}
            position={[s.lat, s.lng]}
            icon={s.status === "live" || s.status === "synced" ? liveIcon : s.status === "deploying" ? starIcon : queuedIcon}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong style={{ fontSize: 13 }}>{s.site_name || s.name || s.keyword}</strong>
                <br />
                <span style={{ fontSize: 11, color: "#666" }}>{s.niche} · {s.target_city}, {s.target_state}</span>
                <br />
                <span style={{ fontSize: 11, fontWeight: 700, color: s.status === "live" ? "#16a34a" : "#f59e0b" }}>
                  {s.status?.toUpperCase()}
                </span>
                {s.site_url && (
                  <>
                    <br />
                    <a href={s.site_url} target="_blank" rel="noopener" style={{ fontSize: 11, color: "#126fc8" }}>
                      {s.site_url}
                    </a>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <style>{`
        @keyframes mp-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; }
        .leaflet-popup-content { margin: 10px 12px !important; }
      `}</style>
    </div>
  );
}