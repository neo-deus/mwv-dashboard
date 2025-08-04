"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { validatePolygon } from "@/utils/helpers";
import * as L from "leaflet";

interface PolygonManagerProps {
  mapRef: React.RefObject<any>;
}

export function PolygonManager({ mapRef }: PolygonManagerProps) {
  const {
    polygons,
    addPolygon,
    updatePolygon,
    removePolygon,
    dataSources,
    setIsDrawing,
    setSelectedPolygon,
  } = useDashboardStore();

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    const map = mapRef.current;

    console.log("PolygonManager: Setting up event listeners", {
      map: !!map,
      pm: !!map.pm,
    });

    // Add a global event listener to capture ALL Geoman events for debugging
    const debugListeners: { [key: string]: (e: any) => void } = {};

    // List of all possible Geoman events to monitor
    const geomanEvents = [
      "pm:create",
      "pm:remove",
      "pm:edit",
      "pm:update",
      "pm:change",
      "pm:vertexadded",
      "pm:vertexremoved",
      "pm:markerdragend",
      "pm:layerreset",
      "pm:snapdrag",
      "pm:snap",
      "pm:unsnap",
      "pm:centerplaced",
      "pm:drawstart",
      "pm:drawend",
      "pm:editstart",
      "pm:editend",
      "pm:enable",
      "pm:disable",
    ];

    // Add listeners for all events to see what's actually firing
    geomanEvents.forEach((eventName) => {
      const listener = (e: any) => {
        console.log(`🔍 Geoman Event Captured: ${eventName}`, e);
      };
      debugListeners[eventName] = listener;
      map.on(eventName, listener);
    });

    // Handle polygon creation
    const handlePolygonCreate = (e: any) => {
      const layer = e.layer;
      const coordinates: [number, number][] = layer
        .getLatLngs()[0]
        .map((latlng: any) => [latlng.lat, latlng.lng]);

      // Close the polygon by adding first point at the end
      coordinates.push(coordinates[0]);

      const validation = validatePolygon(coordinates);

      if (!validation.isValid) {
        alert(validation.error || "Invalid polygon");
        map.removeLayer(layer);
        return;
      }

      // Prompt for polygon name
      const name =
        prompt("Enter polygon name:") || `Polygon ${polygons.length + 1}`;

      // Select data source (use first available)
      const dataSource = dataSources[0]?.id || "temperature";

      // Add polygon to store
      addPolygon({
        name,
        coordinates,
        dataSource,
        color: "#9ca3af", // Default gray, will be updated based on data
      });

      // Remove the temporary layer (we'll manage polygons through the store)
      map.removeLayer(layer);
      setIsDrawing(false);
    };

    // Handle polygon deletion
    const handlePolygonDelete = (e: any) => {
      // This will be handled through our UI controls
    };

    // Handle polygon editing - listen to multiple Geoman events
    const handlePolygonEdit = (e: any) => {
      console.log("Polygon edit event (pm:edit):", e);
      processPolygonEdit(e);
    };

    const handlePolygonUpdate = (e: any) => {
      console.log("Polygon update event (pm:update):", e);
      processPolygonEdit(e);
    };

    const handlePolygonChange = (e: any) => {
      console.log("Polygon change event (pm:change):", e);
      processPolygonEdit(e);
    };

    const processPolygonEdit = (e: any) => {
      const layers = e.layers || [e.layer];

      layers.forEach((layer: any) => {
        if (layer instanceof L.Polygon && (layer as any).isCustomPolygon) {
          const coordinates = layer.getLatLngs()[0] as any[];
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
            const polygonId = (layer as any)._polygonId;
            if (polygonId) {
              const originalPolygon = polygons.find((p) => p.id === polygonId);
              if (originalPolygon) {
                const latLngs = originalPolygon.coordinates.map((coord) =>
                  L.latLng(coord[0], coord[1])
                );
                layer.setLatLngs(latLngs);
              }
            }
            return;
          }

          // Find the polygon ID associated with this layer
          const polygonId = (layer as any)._polygonId;

          if (polygonId) {
            // Convert to [number, number][] format
            const polygonCoordinates: [number, number][] = coordinates.map(
              (coord) => [coord.lat, coord.lng]
            );

            // Close the polygon by adding first point at the end
            if (polygonCoordinates.length > 0) {
              polygonCoordinates.push(polygonCoordinates[0]);
            }

            // Update the polygon in the store
            updatePolygon(polygonId, {
              coordinates: polygonCoordinates,
            });

            console.log(
              `Polygon ${polygonId} updated in store with new coordinates:`,
              polygonCoordinates
            );
          } else {
            console.warn("Could not find polygon ID for edited layer");
          }
        }
      });
    };

    // Add event listeners - listen to multiple edit events
    map.on("pm:create", handlePolygonCreate);
    map.on("pm:remove", handlePolygonDelete);
    map.on("pm:edit", handlePolygonEdit);
    map.on("pm:update", handlePolygonUpdate);
    map.on("pm:change", handlePolygonChange);

    // Also listen for the specific vertex drag events
    map.on("pm:vertexadded", handlePolygonEdit);
    map.on("pm:vertexremoved", handlePolygonEdit);
    map.on("pm:markerdragend", handlePolygonEdit);

    // Cleanup
    return () => {
      if (map && map.off) {
        // Remove debug listeners
        geomanEvents.forEach((eventName) => {
          if (debugListeners[eventName]) {
            map.off(eventName, debugListeners[eventName]);
          }
        });

        // Remove main event listeners
        map.off("pm:create", handlePolygonCreate);
        map.off("pm:remove", handlePolygonDelete);
        map.off("pm:edit", handlePolygonEdit);
        map.off("pm:update", handlePolygonUpdate);
        map.off("pm:change", handlePolygonChange);
        map.off("pm:vertexadded", handlePolygonEdit);
        map.off("pm:vertexremoved", handlePolygonEdit);
        map.off("pm:markerdragend", handlePolygonEdit);
      }
    };
  }, [
    mapRef,
    polygons.length,
    dataSources,
    addPolygon,
    updatePolygon,
    setIsDrawing,
  ]);

  // Render existing polygons
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    const map = mapRef.current;
    const L = window.L;

    // Clear existing polygon layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon && (layer as any).isCustomPolygon) {
        map.removeLayer(layer);
      }
    });

    // Add current polygons
    polygons.forEach((polygon) => {
      const latlngs: [number, number][] = polygon.coordinates.map(
        (coord) => [coord[0], coord[1]] as [number, number]
      );

      const polygonLayer = L.polygon(latlngs, {
        color: polygon.color,
        fillColor: polygon.color,
        fillOpacity: 0.5,
        weight: 2,
      } as any).addTo(map);

      // Mark as custom polygon and store the polygon ID
      (polygonLayer as any).isCustomPolygon = true;
      (polygonLayer as any)._polygonId = polygon.id;

      // Add popup with polygon info
      polygonLayer.bindPopup(`
        <div>
          <h3 class="font-semibold">${polygon.name}</h3>
          <p class="text-sm">Data Source: ${polygon.dataSource}</p>
          <p class="text-sm">Points: ${polygon.coordinates.length - 1}</p>
          <button 
            onclick="window.deletePolygon('${polygon.id}')" 
            class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded"
          >
            Delete
          </button>
        </div>
      `);

      // Handle polygon selection
      polygonLayer.on("click", () => {
        setSelectedPolygon(polygon.id);
      });
    });

    // Add global delete function
    (window as any).deletePolygon = (id: string) => {
      removePolygon(id);
    };

    // Cleanup
    return () => {
      delete (window as any).deletePolygon;
    };
  }, [polygons, mapRef, removePolygon, setSelectedPolygon]);

  return null; // This component doesn't render anything directly
}
