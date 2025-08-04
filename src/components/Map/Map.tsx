"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-geoman/dist/leaflet-geoman.css";
import { GeomanControls } from "./GeomanControls";
import { PolygonLayer } from "./PolygonLayer";
import { GeomanEvents } from "./GeomanEvents";

export function Map() {
  return (
    <MapContainer
      center={[20.5937, 78.9629]} // Centered on India
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      className="z-0" // Ensure map is in the background
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* This component just adds the Geoman toolbar to the map */}
      <GeomanControls />

      {/* This component listens for Geoman events (create, edit, remove) */}
      <GeomanEvents />

      {/* This component reads from your store and renders the polygons */}
      <PolygonLayer />

    </MapContainer>
  );
}