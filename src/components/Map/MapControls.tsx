"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Home, Square } from "lucide-react";

interface MapControlsProps {
  mapRef: React.RefObject<any>;
}

export function MapControls({ mapRef }: MapControlsProps) {
  const { isDrawing, setIsDrawing, map, setMapCenter, setMapZoom } =
    useDashboardStore();

  const handleCenterReset = () => {
    if (mapRef.current) {
      const defaultCenter: [number, number] = [52.52, 13.41]; // Berlin
      const defaultZoom = 10;

      mapRef.current.setView(defaultCenter, defaultZoom);
      setMapCenter(defaultCenter);
      setMapZoom(defaultZoom);
    }
  };

  const handleDrawToggle = () => {
    setIsDrawing(!isDrawing);

    if (mapRef.current && window.L) {
      const map = mapRef.current;

      if (!isDrawing) {
        // Start drawing mode
        if (map.pm) {
          map.pm.enableDraw("Polygon", {
            finishOn: "dblclick",
            allowSelfIntersection: false,
          });
        }
      } else {
        // Stop drawing mode
        if (map.pm) {
          map.pm.disableDraw();
        }
      }
    }
  };

  useEffect(() => {
    // Initialize Geoman when map is ready
    if (mapRef.current && typeof window !== "undefined") {
      const initializeGeoman = async () => {
        try {
          // Import Geoman
          await import("@geoman-io/leaflet-geoman-free");

          const map = mapRef.current;
          if (!map) return;

          // Wait for the map to be fully initialized
          const checkMapReady = () => {
            return new Promise<void>((resolve) => {
              if (map._loaded && map.pm) {
                resolve();
              } else {
                setTimeout(() => {
                  checkMapReady().then(resolve);
                }, 50);
              }
            });
          };

          await checkMapReady();

          // Now safely initialize Geoman controls
          if (map.pm && !map.pm._controlsAdded) {
            map.pm.addControls({
              position: "topleft",
              drawCircle: false,
              drawCircleMarker: false,
              drawPolyline: false,
              drawRectangle: false,
              drawMarker: false,
              cutPolygon: false,
              editMode: true,
              dragMode: false,
              removalMode: true,
            });

            // Mark controls as added to avoid duplicate initialization
            map.pm._controlsAdded = true;

            // Hide default controls, we'll use our custom ones
            map.pm.getControls().forEach((control: any) => {
              if (control._container) {
                control._container.style.display = "none";
              }
            });
          }
        } catch (error) {
          console.error("Failed to initialize Geoman:", error);
        }
      };

      initializeGeoman();
    }
  }, [mapRef]);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={handleCenterReset}
        title="Reset map center"
      >
        <Home className="h-4 w-4" />
      </Button>

      <Button
        variant={isDrawing ? "default" : "secondary"}
        size="icon"
        onClick={handleDrawToggle}
        title={isDrawing ? "Stop drawing" : "Start drawing polygon"}
      >
        <Square className="h-4 w-4" />
      </Button>
    </div>
  );
}
