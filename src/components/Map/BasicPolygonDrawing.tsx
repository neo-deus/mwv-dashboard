"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import * as L from "leaflet";

// Type augmentation for map with custom properties
interface ExtendedMap extends L.Map {
  _basicDrawingSetup?: boolean;
  _startPolygonDrawing?: () => void;
  _stopPolygonDrawing?: () => void;
}

export function BasicPolygonDrawing() {
  const map = useMap() as ExtendedMap;
  const { addPolygon, isDrawing, setIsDrawing } = useDashboardStore();

  useEffect(() => {
    const setupBasicDrawing = async () => {
      try {
        const L = await import("leaflet");

        if (!map._basicDrawingSetup) {
          console.log("Setting up basic polygon drawing...");

          let isCurrentlyDrawing = false;
          let currentPolygon: L.Polygon | L.Polyline | null = null;
          let currentPoints: [number, number][] = [];

          // Store drawing state on map instance
          map._basicDrawingSetup = true;
          map._startPolygonDrawing = () => {
            if (isCurrentlyDrawing) return;

            isCurrentlyDrawing = true;
            currentPoints = [];
            map.getContainer().style.cursor = "crosshair";

            console.log("Polygon drawing started");
          };

          map._stopPolygonDrawing = () => {
            if (!isCurrentlyDrawing) return;

            isCurrentlyDrawing = false;
            map.getContainer().style.cursor = "";

            if (currentPolygon) {
              map.removeLayer(currentPolygon);
              currentPolygon = null;
            }

            if (currentPoints.length >= 3) {
              // Save the completed polygon
              addPolygon({
                name: `Polygon ${Date.now()}`,
                coordinates: currentPoints,
                dataSource: "temperature",
                color: "#3b82f6",
              });
              console.log("Polygon saved with", currentPoints.length, "points");
            }

            currentPoints = [];
            setIsDrawing(false);
            console.log("Polygon drawing stopped");
          };

          // Handle map clicks for drawing
          map.on("click", (e: L.LeafletMouseEvent) => {
            if (!isCurrentlyDrawing) return;

            const point: [number, number] = [e.latlng.lat, e.latlng.lng];
            currentPoints.push(point);

            console.log("Point added:", point);

            // Remove previous polygon preview
            if (currentPolygon) {
              map.removeLayer(currentPolygon);
            }

            // Show polygon preview if we have at least 3 points
            if (currentPoints.length >= 3) {
              currentPolygon = L.default
                .polygon(currentPoints, {
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.2,
                  weight: 2,
                })
                .addTo(map);
            } else if (currentPoints.length >= 2) {
              // Show line preview
              currentPolygon = L.default
                .polyline(currentPoints, {
                  color: "#3b82f6",
                  weight: 2,
                  dashArray: "5, 5",
                })
                .addTo(map);
            }
          });

          // Handle double-click to finish polygon
          map.on("dblclick", (e: L.LeafletMouseEvent) => {
            if (!isCurrentlyDrawing) return;

            e.originalEvent.preventDefault();
            map._stopPolygonDrawing?.();
          });

          console.log("Basic polygon drawing setup complete");
        }
      } catch (error) {
        console.error("Failed to setup basic drawing:", error);
      }
    };

    setupBasicDrawing();
  }, [map, addPolygon, setIsDrawing]);

  // React to drawing state changes
  useEffect(() => {
    if (map && map._basicDrawingSetup) {
      if (isDrawing) {
        map._startPolygonDrawing?.();
      } else {
        map._stopPolygonDrawing?.();
      }
    }
  }, [isDrawing, map]);

  return null;
}
