"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

export function GeomanTest() {
  const map = useMap();
  const [geomanStatus, setGeomanStatus] = useState("loading");

  useEffect(() => {
    const testGeoman = async () => {
      try {
        console.log("Testing Geoman integration...");

        // Ensure Leaflet is available
        const leafletModule = await import("leaflet");
        if (!window.L) {
          window.L = leafletModule.default;
        }

        // Try to import Geoman
        await import("@geoman-io/leaflet-geoman-free");

        console.log("Geoman imported successfully");
        console.log("Map object:", map);
        console.log("Map constructor:", map.constructor.name);
        console.log("Leaflet version:", window.L?.version);
        console.log(
          "L.Map.prototype has pm:",
          !!(window.L?.Map.prototype as any)?.pm
        );

        // Check if pm is attached
        setTimeout(() => {
          if (map.pm) {
            console.log("map.pm is available:", map.pm);
            console.log(
              "map.pm methods:",
              Object.getOwnPropertyNames(Object.getPrototypeOf(map.pm))
            );
            setGeomanStatus("available");
          } else {
            console.log("map.pm is NOT available");
            console.log(
              "Available map properties:",
              Object.getOwnPropertyNames(map)
            );

            // Try manual initialization
            if (window.L && (window.L.Map.prototype as any).pm) {
              try {
                console.log("Attempting manual PM initialization...");
                (map as any).pm = new (window.L as any).PM(map);
                if (map.pm) {
                  console.log("Manual PM initialization successful!");
                  setGeomanStatus("manually initialized");
                } else {
                  setGeomanStatus("manual init failed");
                }
              } catch (error) {
                console.error("Manual PM initialization failed:", error);
                setGeomanStatus("init error");
              }
            } else {
              setGeomanStatus("not available");
            }
          }
        }, 500);
      } catch (error) {
        console.error("Failed to load Geoman:", error);
        setGeomanStatus("error");
      }
    };

    if (map) {
      testGeoman();
    }
  }, [map]);

  const testDraw = () => {
    console.log("Testing draw functionality...");
    if (map.pm) {
      try {
        map.pm.enableDraw("Polygon");
        console.log("Draw enabled successfully");
      } catch (error) {
        console.error("Draw failed:", error);
      }
    } else {
      console.log("map.pm not available for drawing");
    }
  };

  return (
    <div className="absolute top-20 right-4 z-[1000] bg-white p-2 rounded shadow">
      <p>Geoman Status: {geomanStatus}</p>
      <button
        onClick={testDraw}
        className="mt-2 p-1 bg-blue-500 text-white rounded"
      >
        Test Draw
      </button>
    </div>
  );
}
