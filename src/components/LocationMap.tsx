"use client";

import { useEffect, useRef } from "react";

export interface MapPoint {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  leads: number;
  booked: number;
  recovered: number;
}

/**
 * Multi-location map. Renders a Mapbox map (loaded from CDN) with a marker per
 * located shop when NEXT_PUBLIC_MAPBOX_TOKEN is set; otherwise shows a friendly
 * placeholder. The per-location list on the page carries the data either way.
 */
export function LocationMap({ points, token }: { points: MapPoint[]; token?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const located = points.filter((p) => p.latitude != null && p.longitude != null);

  useEffect(() => {
    if (!token || located.length === 0 || !ref.current) return;
    let map: any;
    let cancelled = false;

    // Load Mapbox GL CSS + JS from CDN once.
    const cssId = "mapbox-gl-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    const init = () => {
      const mapboxgl = (window as any).mapboxgl;
      if (!mapboxgl || cancelled || !ref.current) return;
      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [located[0].longitude, located[0].latitude],
        zoom: 8,
      });
      const bounds = new mapboxgl.LngLatBounds();
      for (const p of located) {
        const el = document.createElement("div");
        const size = 14 + Math.min(20, p.booked);
        el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:#5b46f9;border:3px solid #fff;box-shadow:0 2px 8px rgba(91,70,249,.5);cursor:pointer;`;
        const popup = new mapboxgl.Popup({ offset: 14 }).setHTML(
          `<div style="font-family:sans-serif;font-size:12px;"><b>${p.name}</b><br/>${p.booked} booked · $${p.recovered.toLocaleString()}<br/>${p.leads} leads</div>`,
        );
        new mapboxgl.Marker(el).setLngLat([p.longitude, p.latitude]).setPopup(popup).addTo(map);
        bounds.extend([p.longitude, p.latitude]);
      }
      if (located.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 10 });
    };

    if ((window as any).mapboxgl) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js";
      s.onload = init;
      document.body.appendChild(s);
    }
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [token, located]);

  if (!token || located.length === 0) {
    return (
      <div
        style={{
          height: 260,
          borderRadius: 14,
          border: "1px dashed var(--line)",
          background: "var(--card-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "var(--faint)",
          fontSize: 13,
          padding: 24,
        }}
      >
        {!token
          ? "Set NEXT_PUBLIC_MAPBOX_TOKEN and add coordinates to each location to see the live map."
          : "Add latitude/longitude to your locations to plot them on the map."}
      </div>
    );
  }
  return <div ref={ref} style={{ height: 320, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }} />;
}
