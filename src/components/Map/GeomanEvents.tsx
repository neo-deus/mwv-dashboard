"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import { validatePolygon } from "@/utils/helpers";
import * as L from "leaflet";

export function GeomanEvents() {
  const map = useMap();
  const { polygons, addPolygon, updatePolygon, removePolygon } = useDashboardStore();

  useEffect(() => {
    // This effect should only run once to set up global listeners
    if (!map) return;

    // --- Event: Polygon Creation ---
    const handleCreate = (e: any) => {
      const { layer, layerType } = e;
      if (layerType === "polygon") {
        const coordinates: [number, number][] = layer
          .getLatLngs()[0]
          .map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);

        // Close the polygon by adding the first point at the end
        if (coordinates.length > 0) {
            coordinates.push(coordinates[0]);
        }

        const validation = validatePolygon(coordinates);
        if (!validation.isValid) {
          alert(validation.error || "Invalid polygon");
          map.removeLayer(layer); // Remove the invalid layer Geoman created
          return;
        }

        const name = prompt("Enter polygon name:", `Polygon ${polygons.length + 1}`);
        if (!name) {
          map.removeLayer(layer); // User cancelled, remove layer
          return;
        }

        // Add the new polygon to our central store
        addPolygon({
          name,
          coordinates,
          dataSource: "temperature", // Default data source
          color: "#9ca3af",
        });

        // IMPORTANT: Remove the temporary layer drawn by Geoman.
        // Our <PolygonLayer> component will be responsible for rendering the polygon from the store.
        map.removeLayer(layer);
      }
    };

    // --- Event: Polygon Editing ---
    const handleEdit = (e: any) => {
        const layer = e.layer;
        // The layer instance is passed by reference, so we can find its ID
        const polygonId = (layer as any)._polygonId;

        if (polygonId) {
            const latlngs: L.LatLng[] = layer.getLatLngs()[0];
            const newCoordinates: [number, number][] = latlngs.map(latlng => [latlng.lat, latlng.lng]);

            // Close the polygon
            if (newCoordinates.length > 0) {
                newCoordinates.push(newCoordinates[0]);
            }

            const validation = validatePolygon(newCoordinates);
            if (!validation.isValid) {
                alert(validation.error || "Invalid polygon shape after edit. Reverting.");
                // Revert changes by fetching original data from the store
                const originalPolygon = polygons.find(p => p.id === polygonId);
                if (originalPolygon) {
                    const originalLatLngs = originalPolygon.coordinates.map(c => L.latLng(c[0], c[1]));
                    layer.setLatLngs(originalLatLngs.slice(0, -1)); // Remove the closing point for setLatLngs
                }
                return;
            }
            
            // Update the coordinates in our central store
            updatePolygon(polygonId, { coordinates: newCoordinates });
            console.log(`Polygon ${polygonId} updated in store.`);
        }
    };

    // --- Event: Polygon Removal ---
    const handleRemove = (e: any) => {
        const layer = e.layer;
        const polygonId = (layer as any)._polygonId;

        if (polygonId) {
            // Use a confirmation before deleting
            if (window.confirm(`Are you sure you want to delete this polygon?`)) {
                removePolygon(polygonId);
                console.log(`Polygon ${polygonId} removed from store.`);
            } else {
                // If user cancels, Geoman has already removed the layer from the map.
                // We need to prevent this or re-add it. The easiest way is to just
                // let our declarative PolygonLayer handle re-adding it on the next render.
                // For a cleaner UX, you might disable Geoman's default removal UI
                // and rely solely on a delete button in your own UI.
            }
        }
    };


    map.on("pm:create", handleCreate);
    map.on("pm:edit", handleEdit);
    map.on("pm:remove", handleRemove);

    // Cleanup listeners when the component unmounts
    return () => {
      map.off("pm:create", handleCreate);
      map.off("pm:edit", handleEdit);
      map.off("pm:remove", handleRemove);
    };
    // We pass the store functions as dependencies so the handlers always have the latest versions.
  }, [map, addPolygon, updatePolygon, removePolygon, polygons]);

  return null; // This component renders nothing.
}
