"use client";

import { Polygon, Popup } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { useMap } from "react-leaflet";

export function PolygonRenderer() {
  const { polygons, removePolygon, setSelectedPolygon, editingPolygon } =
    useDashboardStore();
  const layersRef = useRef<{ [key: string]: L.Polygon }>({});
  const map = useMap();

  // Effect to sync Leaflet layers with the Zustand store
  useEffect(() => {
    console.log("PolygonRenderer: Syncing polygons", polygons.length);

    // Get all existing layers that are managed by Geoman (freshly created)
    const existingGeomanLayers: string[] = [];
    map.eachLayer((layer: any) => {
      if (
        layer instanceof L.Polygon &&
        (layer as any)._polygonId &&
        (layer as any).isCustomPolygon
      ) {
        existingGeomanLayers.push((layer as any)._polygonId);
        console.log(
          `Found existing Geoman layer for polygon: ${
            (layer as any)._polygonId
          }`
        );
      }
    });

    const currentLayerIds = Object.keys(layersRef.current);
    const polygonIds = polygons.map((p) => p.id);

    // Remove layers that are no longer in the store
    currentLayerIds.forEach((layerId) => {
      if (!polygonIds.includes(layerId)) {
        console.log(`PolygonRenderer: Removing layer ${layerId}`);
        const layer = layersRef.current[layerId];
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
        delete layersRef.current[layerId];
      }
    });

    // Add layers ONLY for polygons that don't already exist as Geoman layers
    polygons.forEach((polygon) => {
      const existingLayer = layersRef.current[polygon.id];
      const hasGeomanLayer = existingGeomanLayers.includes(polygon.id);

      if (!existingLayer && !hasGeomanLayer) {
        console.log(
          `PolygonRenderer: Creating restoration layer for ${polygon.id} (${polygon.name})`
        );

        // Create coordinates (remove the last duplicate point if it exists)
        let coordinates = [...polygon.coordinates];
        if (
          coordinates.length > 1 &&
          coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
          coordinates[0][1] === coordinates[coordinates.length - 1][1]
        ) {
          coordinates = coordinates.slice(0, -1); // Remove duplicate last point
        }

        const latLngs = coordinates.map(
          (coord) => [coord[0], coord[1]] as [number, number]
        );

        const polygonLayer = L.polygon(latLngs, {
          color: polygon.color,
          fillColor: polygon.color,
          fillOpacity: 0.5,
          weight: 2,
        }).addTo(map);

        // Enable editing only if this polygon is being edited
        if (editingPolygon === polygon.id) {
          polygonLayer.pm.enable();
        } else {
          polygonLayer.pm.disable();
        }

        // Mark this layer with our polygon ID and custom flag
        (polygonLayer as any)._polygonId = polygon.id;
        (polygonLayer as any).isCustomPolygon = true;
        (polygonLayer as any).restoredFromStore = true; // Mark as restored

        // Add edit handler for this restored polygon (Lovable's approach)
        polygonLayer.on("pm:edit", () => {
          console.log(
            `🔥 PolygonRenderer: Edit event on restored polygon ${polygon.id}`
          );
          const coordinates = polygonLayer.getLatLngs()[0] as L.LatLng[];
          const coords: [number, number][] = coordinates.map((coord) => [
            coord.lat,
            coord.lng,
          ]);

          // Close the polygon by adding the first point at the end for proper polygon storage
          if (coords.length > 0) {
            coords.push(coords[0]);
          }

          // Update store using the correct updatePolygon signature for your store
          const { updatePolygon } = useDashboardStore.getState();
          updatePolygon(polygon.id, {
            coordinates: coords,
          });
          console.log(
            `✅ Updated polygon ${polygon.id} coordinates in store`,
            coords.length,
            "points"
          );
        });

        // Add additional event handlers for vertex dragging (like Lovable does)
        polygonLayer.on("pm:markerdragend", () => {
          console.log(
            `🔥 PolygonRenderer: Vertex drag ended on polygon ${polygon.id}`
          );
          const coordinates = polygonLayer.getLatLngs()[0] as L.LatLng[];
          const coords: [number, number][] = coordinates.map((coord) => [
            coord.lat,
            coord.lng,
          ]);

          if (coords.length > 0) {
            coords.push(coords[0]);
          }

          const { updatePolygon } = useDashboardStore.getState();
          updatePolygon(polygon.id, {
            coordinates: coords,
          });
          console.log(
            `✅ Vertex drag update: polygon ${polygon.id} coordinates in store`,
            coords.length,
            "points"
          );
        });

        // Add popup with polygon info
        polygonLayer.bindPopup(`
          <div>
            <h3 style="font-weight: bold; margin: 0 0 8px 0;">${polygon.name}</h3>
            <p style="margin: 4px 0;">Data Source: ${polygon.dataSource}</p>
            <p style="margin: 4px 0;">Points: ${coordinates.length}</p>
            <button 
              onclick="window.deletePolygon('${polygon.id}')" 
              style="margin-top: 8px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              Delete
            </button>
          </div>
        `);

        // Handle polygon selection
        polygonLayer.on("click", () => {
          setSelectedPolygon(polygon.id);
        });

        // Store reference
        layersRef.current[polygon.id] = polygonLayer;

        console.log(
          `✅ Restored polygon ${polygon.id} with ${coordinates.length} points and color ${polygon.color}`
        );
      } else if (hasGeomanLayer) {
        console.log(
          `PolygonRenderer: Skipping ${polygon.id} - already managed by Geoman`
        );
      }
    });
  }, [polygons, map, removePolygon, setSelectedPolygon, editingPolygon]);

  // Set up global delete function
  useEffect(() => {
    (window as any).deletePolygon = (id: string) => {
      console.log(`PolygonRenderer: Deleting polygon ${id}`);
      removePolygon(id);
    };

    return () => {
      delete (window as any).deletePolygon;
    };
  }, [removePolygon]);

  return null; // This component renders through Leaflet directly
}
