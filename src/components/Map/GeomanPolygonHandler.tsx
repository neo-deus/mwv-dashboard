"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import * as L from "leaflet";

interface ExtendedLayer extends L.Layer {
  _polygonId?: string;
}

interface GeomanEditEvent {
  layer?: L.Layer;
  layers?: L.Layer[];
}

export function GeomanPolygonHandler() {
  const map = useMap();
  const { updatePolygon, polygons } = useDashboardStore();

  useEffect(() => {
    if (!map) return;

    // NOTE: Polygon creation is now handled by PolygonManager.tsx to avoid duplicates
    // This component only handles editing events

    const handlePolygonEdit = (e: GeomanEditEvent) => {
      console.log("Polygon edit event:", e);

      // Handle both single layer edit and bulk edit
      const layers = e.layers || (e.layer ? [e.layer] : []);

      layers.forEach((layer: L.Layer) => {
        if (layer instanceof L.Polygon) {
          const coordinates = (
            layer as L.Polygon
          ).getLatLngs()[0] as L.LatLng[];
          const pointCount = coordinates.length;

          console.log(`Polygon edited with ${pointCount} points`);

          if (pointCount < 3 || pointCount > 12) {
            console.warn(
              `Invalid edited polygon: ${pointCount} points. Must be between 3-12 points.`
            );
            alert(
              `Polygon must have between 3-12 points. Your polygon has ${pointCount} points. Changes will be reverted.`
            );

            // Revert changes by finding original polygon
            const polygonId = (layer as ExtendedLayer)._polygonId;
            if (polygonId) {
              const originalPolygon = polygons.find((p) => p.id === polygonId);
              if (originalPolygon) {
                const latLngs = originalPolygon.coordinates.map((coord) =>
                  L.latLng(coord[0], coord[1])
                );
                (layer as L.Polygon).setLatLngs(latLngs);
              }
            }
            return;
          }

          // Find the polygon ID associated with this layer
          const polygonId = (layer as ExtendedLayer)._polygonId;

          if (polygonId) {
            // Convert L.LatLng[] to [number, number][]
            const polygonCoordinates: [number, number][] = coordinates.map(
              (coord) => [coord.lat, coord.lng]
            );

            // Update the polygon in the store
            updatePolygon(polygonId, {
              coordinates: polygonCoordinates,
            });

            console.log(
              `Polygon ${polygonId} updated in store with new coordinates`
            );
          } else {
            console.warn("Could not find polygon ID for edited layer");
          }
        }
      });
    };

    // Add event listeners - only for editing, creation handled by PolygonManager
    map.on("pm:edit", handlePolygonEdit);

    return () => {
      // Cleanup
      map.off("pm:edit", handlePolygonEdit);
    };
  }, [map, updatePolygon, polygons]);

  return null; // This component doesn't render anything
}
