"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import MapControls2 from "./MapControls2";
import { GeomanControl } from "./GeomanControl";
import { GeomanController } from "./GeomanController";
import { PolygonRenderer } from "./PolygonRenderer";
import { PolygonColorUpdater } from "./PolygonColorUpdater";

export default function MapComponentInner() {
  const { map, setMapCenter, setMapZoom } = useDashboardStore();
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Fix Leaflet default markers only on client side
    if (typeof window !== "undefined") {
      const setupLeaflet = async () => {
        try {
          const L = await import("leaflet");

          // Fix default marker icons
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          });
        } catch (error) {
          console.error("Error setting up Leaflet:", error);
        }
      };

      setupLeaflet();
    }
  }, []);

  const handleMapReady = () => {
    if (mapRef.current) {
      const mapInstance = mapRef.current;

      // Store the actual map instance for components to use
      mapRef.current = mapInstance;

      // Handle map movement
      mapInstance.on("moveend", () => {
        const center = mapInstance.getCenter();
        setMapCenter([center.lat, center.lng]);
      });

      // Handle zoom changes
      mapInstance.on("zoomend", () => {
        setMapZoom(mapInstance.getZoom());
      });
    }
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={map.center}
        zoom={map.zoom}
        style={{ height: "100%", width: "100%" }}
        whenReady={handleMapReady}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Geoman Control (Polygon Only) */}
        <GeomanControl position="topright" />

        {/* NEW: Geoman Controller for handling events */}
        <GeomanController />

        {/* Map Controls */}
        <MapControls2 />

        {/* Polygon Renderer - restores polygons from store on page load */}
        <PolygonRenderer />

        {/* Polygon Color Updater - updates map colors when store changes */}
        <PolygonColorUpdater />
      </MapContainer>
    </div>
  );
}
