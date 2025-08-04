"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import * as L from "leaflet";

export function GeomanController() {
  const map = useMap();
  const { addPolygon, updatePolygon, polygons, editingPolygon } =
    useDashboardStore();

  useEffect(() => {
    if (!map || !map.pm) return;

    console.log("GeomanController: Setting up controls and events");

    // Add Geoman controls to the map (this might conflict with existing controls)
    // We'll configure them to work with our existing setup
    map.pm.setGlobalOptions({
      pinning: true,
      snappable: true,
    });

    // --- Event Listener for CREATING Polygons ---
    const handleCreate = (e: any) => {
      console.log("🔥 GeomanController: pm:create event", e);
      const { layer } = e;

      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];

        console.log(`New polygon created with ${latlngs.length} vertices`);

        // 1. Validate Vertex Count
        if (latlngs.length < 3 || latlngs.length > 12) {
          alert(
            `Polygons must have between 3 and 12 vertices. Yours has ${latlngs.length}.`
          );
          map.removeLayer(layer);
          return;
        }

        // 2. Prompt for name
        const name = prompt(
          "Enter polygon name:",
          `Polygon ${polygons.length + 1}`
        );
        if (!name) {
          map.removeLayer(layer);
          return;
        }

        // 3. Convert coordinates for storing
        const coordinates: [number, number][] = latlngs.map((latlng) => [
          latlng.lat,
          latlng.lng,
        ]);

        // Close the polygon by adding the first point at the end for proper polygon storage
        if (coordinates.length > 0) {
          coordinates.push(coordinates[0]);
        }

        // 4. Add to Zustand store
        const newPolygon = addPolygon({
          name,
          coordinates,
          dataSource: "temperature", // Default
          color: "#9ca3af",
        });

        // 5. CRITICAL: Store the polygon ID in the layer so we can track it
        (layer as any)._polygonId = newPolygon.id;
        (layer as any).isCustomPolygon = true;

        // 6. Apply the correct styling to match the stored color
        layer.setStyle({
          color: newPolygon.color,
          fillColor: newPolygon.color,
          fillOpacity: 0.5,
          weight: 2,
        });

        // 7. Disable editing by default - user must click Edit button to enable
        layer.pm.disable();

        // 8. Add edit event handlers to the newly created layer
        layer.on("pm:edit", () => {
          console.log(
            `🔥 GeomanController: Edit event on new polygon ${newPolygon.id}`
          );
          handleEdit({ layer });
        });

        layer.on("pm:markerdragend", () => {
          console.log(
            `🔥 GeomanController: Vertex drag on new polygon ${newPolygon.id}`
          );
          handleEdit({ layer });
        });

        console.log(`Polygon created and stored with ID: ${newPolygon.id}`);

        // DON'T remove the layer - let Geoman manage it for editing
        // This is the key difference from our previous approach
      }
    };

    // --- Event Listener for EDITING Polygons ---
    const handleEdit = (e: any) => {
      console.log("🔥 GeomanController: pm:edit event", e);
      const { layer } = e;

      if (layer instanceof L.Polygon && (layer as any).isCustomPolygon) {
        const polygonId = (layer as any)._polygonId;
        if (!polygonId) {
          console.warn("No polygon ID found on edited layer");
          return;
        }

        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        console.log(
          `Editing polygon ${polygonId} with ${latlngs.length} vertices`
        );

        // Validate on edit
        if (latlngs.length < 3 || latlngs.length > 12) {
          alert(
            `Polygons must have between 3 and 12 vertices. Yours has ${latlngs.length}. Edit rejected.`
          );

          // Find the original coordinates from the store and revert
          const originalPolygon = polygons.find((p) => p.id === polygonId);
          if (originalPolygon) {
            const originalLatLngs = originalPolygon.coordinates.map((c) =>
              L.latLng(c[0], c[1])
            );
            layer.setLatLngs(originalLatLngs);
          }
          return;
        }

        const newCoordinates: [number, number][] = latlngs.map((latlng) => [
          latlng.lat,
          latlng.lng,
        ]);

        // Close the polygon by adding the first point at the end for proper polygon storage
        if (newCoordinates.length > 0) {
          newCoordinates.push(newCoordinates[0]);
        }

        // Update the polygon in our store
        updatePolygon(polygonId, { coordinates: newCoordinates });
        console.log(
          `✅ Polygon ${polygonId} updated in store with new coordinates`
        );
      }
    };

    // --- Event Listener for REMOVING Polygons ---
    const handleRemove = (e: any) => {
      console.log("🔥 GeomanController: pm:remove event", e);
      const { layer } = e;

      if (layer instanceof L.Polygon && (layer as any).isCustomPolygon) {
        const polygonId = (layer as any)._polygonId;
        if (polygonId) {
          console.log(`Polygon ${polygonId} removed via Geoman`);
          // Update our store to remove the polygon
          // removePolygon(polygonId); // Uncomment if you want Geoman remove to work

          // For now, let's prevent accidental removes and require UI deletion
          layer.addTo(map);
          alert(
            "Please use the delete button in the polygon list to remove shapes."
          );
        }
      }
    };

    // Listen to multiple edit-related events
    const handleVertexDrag = (e: any) => {
      console.log("🔥 GeomanController: vertex drag event", e);
      // This fires during dragging - we might want to handle the end event instead
    };

    const handleMarkerdragend = (e: any) => {
      console.log("🔥 GeomanController: pm:markerdragend event", e);
      // This should fire when vertex dragging ends
      handleEdit(e);
    };

    // Add all event listeners
    map.on("pm:create", handleCreate);
    map.on("pm:edit", handleEdit);
    map.on("pm:remove", handleRemove);
    map.on("pm:markerdragend", handleMarkerdragend);

    // Additional events that might be useful
    map.on("pm:editstart", (e: any) => console.log("🔥 Edit started", e));
    map.on("pm:editend", (e: any) => console.log("🔥 Edit ended", e));

    console.log("GeomanController: All event listeners registered");

    // Cleanup function
    return () => {
      console.log("GeomanController: Cleaning up event listeners");
      map.off("pm:create", handleCreate);
      map.off("pm:edit", handleEdit);
      map.off("pm:remove", handleRemove);
      map.off("pm:markerdragend", handleMarkerdragend);
      map.off("pm:editstart");
      map.off("pm:editend");
    };
  }, [map, addPolygon, updatePolygon, polygons]);

  // Separate effect to handle editing state changes
  useEffect(() => {
    if (!map) return;

    // Enable/disable editing for all polygon layers based on editingPolygon state
    map.eachLayer((layer: any) => {
      if (
        layer instanceof L.Polygon &&
        (layer as any)._polygonId &&
        (layer as any).isCustomPolygon
      ) {
        const polygonId = (layer as any)._polygonId;

        if (editingPolygon === polygonId) {
          console.log(`Enabling editing for polygon ${polygonId}`);
          layer.pm.enable();
        } else {
          console.log(`Disabling editing for polygon ${polygonId}`);
          layer.pm.disable();
        }
      }
    });
  }, [map, editingPolygon]);

  return null; // This component does not render anything itself
}
