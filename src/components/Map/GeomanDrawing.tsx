"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import * as L from "leaflet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWindow = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMap = any;

export function GeomanDrawing() {
  const map = useMap();
  const { addPolygon } = useDashboardStore();

  useEffect(() => {
    const setupGeoman = async () => {
      try {
        // Import both Leaflet and Geoman
        const L = await import("leaflet");

        // Ensure Leaflet is available globally
        if (!(window as AnyWindow).L) {
          (window as AnyWindow).L = L.default;
        }

        // Import Geoman after Leaflet is ready
        await import("@geoman-io/leaflet-geoman-free");

        // Wait for everything to be ready
        await new Promise((resolve) => setTimeout(resolve, 200));

        // The import should have extended L.Map.prototype
        console.log("Checking Geoman attachment...");
        console.log(
          "L.Map.prototype.pm exists:",
          !!((window as AnyWindow).L?.Map.prototype as AnyMap)?.pm
        );
        console.log("map instance type:", map.constructor.name);
        console.log(
          "map is instance of L.Map:",
          map instanceof (window as AnyWindow).L.Map
        );

        // If Geoman didn't auto-attach, we need to manually extend this map
        if (!(map as AnyMap).pm) {
          console.log("Geoman not auto-attached, attempting manual setup...");

          // Check if the PM constructor is available
          if ((window as AnyWindow).L && (window as AnyWindow).L.PM) {
            try {
              // Manually create PM instance for this map
              const pmInstance = new (window as AnyWindow).L.PM(map);
              (map as AnyMap).pm = pmInstance;
              console.log("Manual PM attachment successful");
            } catch (error) {
              console.error("Manual PM attachment failed:", error);

              // Try alternative approach - call the extension function directly
              if (((window as AnyWindow).L.Map.prototype as AnyMap).pm) {
                console.log("Trying to call pm initialization function...");
                try {
                  ((window as AnyWindow).L.Map.prototype as AnyMap).pm.call(
                    map
                  );
                  console.log("PM function call successful");
                } catch (e) {
                  console.error("PM function call failed:", e);
                  return;
                }
              } else {
                console.error("No PM available on L.Map.prototype");
                return;
              }
            }
          }
        }

        // Final check
        if (!(map as AnyMap).pm) {
          console.error("Geoman did not attach to map after all attempts");
          return;
        }

        console.log("Geoman successfully attached to map");

        // Add controls
        (map as AnyMap).pm.addControls({
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

        // Hide the default controls since we have custom ones
        try {
          const controls = ((map as AnyMap).pm as AnyMap).getControls?.();
          if (controls) {
            controls.forEach((control: { _container?: HTMLElement }) => {
              if (control._container) {
                control._container.style.display = "none";
              }
            });
          }
        } catch (e) {
          console.warn("Could not hide default controls:", e);
        }

        // Listen for polygon creation
        (map as AnyMap).on(
          "pm:create",
          (e: {
            layer: L.Layer & { getLatLngs(): L.LatLng[][] };
            shape: string;
          }) => {
            console.log("Polygon created:", e);

            if (e.shape === "Polygon") {
              const coordinates = e.layer
                .getLatLngs()[0]
                .map(
                  (latLng: L.LatLng) =>
                    [latLng.lat, latLng.lng] as [number, number]
                );

              addPolygon({
                name: `Polygon ${Date.now()}`,
                coordinates,
                dataSource: "temperature",
                color: "#3b82f6",
              });
            }
          }
        );

        console.log("Geoman event listeners attached");
      } catch (error) {
        console.error("Failed to setup Geoman:", error);
      }
    };

    // Add a delay to ensure map is fully ready
    const timer = setTimeout(setupGeoman, 100);

    return () => {
      clearTimeout(timer);
      // Clean up event listeners
      if ((map as AnyMap).pm) {
        (map as AnyMap).off("pm:create");
      }
    };
  }, [map, addPolygon]);

  // This component doesn't render anything visual
  return null;
}
