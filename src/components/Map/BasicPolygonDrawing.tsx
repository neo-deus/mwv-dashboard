"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";

export function BasicPolygonDrawing() {
  const map = useMap();
  const { addPolygon, isDrawing, setIsDrawing } = useDashboardStore();

  useEffect(() => {
    const setupBasicDrawing = async () => {
      try {
        const L = await import("leaflet");

        if (!(map as any)._basicDrawingSetup) {
          console.log("Setting up basic polygon drawing...");

          let isCurrentlyDrawing = false;
          let currentPolygon: any = null;
          let currentPoints: [number, number][] = [];

          // Store drawing state on map instance
          (map as any)._basicDrawingSetup = true;
          (map as any)._startPolygonDrawing = () => {
            if (isCurrentlyDrawing) return;

            isCurrentlyDrawing = true;
            currentPoints = [];
            map.getContainer().style.cursor = "crosshair";

            console.log("Polygon drawing started");
          };

          (map as any)._stopPolygonDrawing = () => {
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
          map.on("click", (e: any) => {
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
          map.on("dblclick", (e: any) => {
            if (!isCurrentlyDrawing) return;

            e.originalEvent.preventDefault();
            (map as any)._stopPolygonDrawing();
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
    if (map && (map as any)._basicDrawingSetup) {
      if (isDrawing) {
        (map as any)._startPolygonDrawing();
      } else {
        (map as any)._stopPolygonDrawing();
      }
    }
  }, [isDrawing, map]);

  return null;
}
