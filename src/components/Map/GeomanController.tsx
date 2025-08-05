"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import {
  fetchPolygonWeatherData,
  fetchPolygonTimeSeries,
} from "@/services/polygonWeatherService";
import { PolygonNameModal } from "@/components/ui/polygon-name-modal";
import * as L from "leaflet";

// Type definitions for Geoman events
interface GeomanCreateEvent {
  layer: L.Layer;
  shape: string;
}

interface GeomanEditEvent {
  layer: L.Layer;
}

interface GeomanRemoveEvent {
  layer: L.Layer;
}

// Extended layer interface for our custom properties
interface ExtendedLayer extends L.Layer {
  _polygonId?: string;
  isCustomPolygon?: boolean;
}

export function GeomanController() {
  const map = useMap();
  const {
    addPolygon,
    updatePolygon,
    polygons,
    editingPolygon,
    dataSources,
    timeline,
    activeDataSourceId,
  } = useDashboardStore();

  // Modal state for polygon naming
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    layer: L.Polygon | null;
    coordinates: [number, number][];
    vertexCount: number;
  }>({
    isOpen: false,
    layer: null,
    coordinates: [],
    vertexCount: 0,
  });

  const handleModalConfirm = (name: string) => {
    const { layer, coordinates } = modalState;
    if (!layer || !coordinates.length) return;

    createPolygonWithName(layer, coordinates, name);
    setModalState({
      isOpen: false,
      layer: null,
      coordinates: [],
      vertexCount: 0,
    });
  };

  const handleModalCancel = () => {
    const { layer } = modalState;
    if (layer) {
      map.removeLayer(layer);
    }
    setModalState({
      isOpen: false,
      layer: null,
      coordinates: [],
      vertexCount: 0,
    });
  };

  // --- Event Handler for EDITING Polygons ---
  const handleEdit = (e: GeomanEditEvent) => {
    console.log("🔥 GeomanController: pm:edit event", e);
    const { layer } = e;

    if (
      layer instanceof L.Polygon &&
      (layer as ExtendedLayer).isCustomPolygon
    ) {
      const polygonId = (layer as ExtendedLayer)._polygonId;
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

  const createPolygonWithName = (
    layer: L.Polygon,
    coordinates: [number, number][],
    name: string
  ) => {
    // 4. Create polygon with temporary color, then fetch weather data
    const newPolygon = addPolygon({
      name,
      coordinates,
      dataSource: activeDataSourceId, // Use active data source
      color: "#9ca3af", // Temporary gray color
    });

    // 5. CRITICAL: Store the polygon ID in the layer so we can track it
    (layer as ExtendedLayer)._polygonId = newPolygon.id;
    (layer as ExtendedLayer).isCustomPolygon = true;

    // 6. Apply temporary styling while fetching weather data
    layer.setStyle({
      color: "#9ca3af",
      fillColor: "#9ca3af",
      fillOpacity: 0.3,
      weight: 2,
    });

    // 7. Fetch weather data and time series data for timeline functionality
    const activeDataSource = dataSources.find(
      (ds) => ds.id === activeDataSourceId
    );
    if (activeDataSource) {
      console.log(
        `Fetching ${activeDataSource.name.toLowerCase()} data and time series for new polygon: ${
          newPolygon.name
        }`
      );

      // Fetch both current weather and time series data
      Promise.all([
        fetchPolygonWeatherData(newPolygon, activeDataSource),
        fetchPolygonTimeSeries(newPolygon),
      ])
        .then(([updatedPolygon, polygonWithTimeSeries]) => {
          console.log(
            `Weather data fetched for ${updatedPolygon.name}: ${updatedPolygon.weatherData?.temperature}°C`
          );
          console.log(
            `Time series data fetched for ${polygonWithTimeSeries.name}: ${polygonWithTimeSeries.timeSeriesData?.data.length} points`
          );

          // Update the polygon in store with both weather data and time series data
          updatePolygon(updatedPolygon.id, {
            color: updatedPolygon.color,
            weatherData: updatedPolygon.weatherData,
            timeSeriesData: polygonWithTimeSeries.timeSeriesData,
          });

          // Update the visual layer styling
          layer.setStyle({
            color: updatedPolygon.color,
            fillColor: updatedPolygon.color,
            fillOpacity: 0.5,
            weight: 2,
          });

          // Update the popup with actual weather data
          const activeDataSource = dataSources.find(
            (ds) => ds.id === activeDataSourceId
          );
          let weatherInfo = "";
          if (updatedPolygon.weatherData && activeDataSource) {
            if (activeDataSource.id === "temperature") {
              weatherInfo = `
                <p style="margin: 4px 0; font-weight: bold; color: ${
                  updatedPolygon.color
                };">
                  Temperature: ${updatedPolygon.weatherData.temperature.toFixed(
                    1
                  )}°C
                </p>`;
            } else if (activeDataSource.id === "windspeed") {
              weatherInfo = `
                <p style="margin: 4px 0; font-weight: bold; color: ${
                  updatedPolygon.color
                };">
                  Wind Speed: ${updatedPolygon.weatherData.windSpeed.toFixed(
                    1
                  )} m/s
                </p>`;
            }
            weatherInfo += `
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                Updated: ${new Date(
                  updatedPolygon.weatherData.timestamp
                ).toLocaleTimeString()}
              </p>`;
          } else {
            weatherInfo = `<p style="margin: 4px 0; color: #999;">Weather data loading...</p>`;
          }

          // Update popup content
          const popup = layer.getPopup();
          if (popup) {
            popup.setContent(`
              <div>
                <h3 style="font-weight: bold; margin: 0 0 8px 0;">${updatedPolygon.name}</h3>
                <p style="margin: 4px 0;">Data Source: ${updatedPolygon.dataSource}</p>
                <p style="margin: 4px 0;">Points: ${coordinates.length}</p>
                ${weatherInfo}
                <button 
                  onclick="window.deletePolygon('${updatedPolygon.id}')" 
                  style="margin-top: 8px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
                >
                  Delete
                </button>
              </div>
            `);
          }

          console.log(
            `✅ Polygon ${updatedPolygon.name} setup complete with timeline data`
          );
        })
        .catch((error) => {
          console.error(
            `Failed to fetch complete weather data for ${newPolygon.name}:`,
            error
          );
          // Keep the gray color if weather fetch fails
        });
    } else {
      console.warn("Temperature data source not found, using default color");
    }

    // 8. Disable editing by default - user must click Edit button to enable
    layer.pm.disable();

    // 9. Add ESSENTIAL click and popup handlers that make the polygon interactive
    // This is what was missing - newly created polygons need these handlers!

    // Add click handler for polygon selection (like PolygonRenderer does)
    layer.on("click", () => {
      console.log(`Polygon ${newPolygon.id} clicked - setting as selected`);
      const { setSelectedPolygon } = useDashboardStore.getState();
      setSelectedPolygon(newPolygon.id);
    });

    // Add initial popup (will be updated when weather data arrives)
    layer.bindPopup(`
      <div>
        <h3 style="font-weight: bold; margin: 0 0 8px 0;">${newPolygon.name}</h3>
        <p style="margin: 4px 0;">Data Source: ${newPolygon.dataSource}</p>
        <p style="margin: 4px 0;">Points: ${coordinates.length}</p>
        <p style="margin: 4px 0; color: #999;">Weather data loading...</p>
        <button 
          onclick="window.deletePolygon('${newPolygon.id}')" 
          style="margin-top: 8px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Delete
        </button>
      </div>
    `);

    // 10. Add edit event handlers to the newly created layer
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
  };

  useEffect(() => {
    if (!map || !(map as L.Map & { pm?: unknown }).pm) return;

    // console.log("GeomanController: Setting up controls and events");

    // Add Geoman controls to the map (this might conflict with existing controls)
    // We'll configure them to work with our existing setup
    (
      map as L.Map & { pm: { setGlobalOptions: (options: unknown) => void } }
    ).pm.setGlobalOptions({
      pinning: true,
      snappable: true,
    });

    // --- Event Listener for CREATING Polygons ---
    const handleCreate = (e: GeomanCreateEvent) => {
      console.log("🔥 GeomanController: pm:create event", e);
      const { layer } = e;

      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];

        console.log(`New polygon created with ${latlngs.length} vertices`);

        // 1. Validate Vertex Count
        if (latlngs.length < 3 || latlngs.length > 12) {
          // Show alert modal instead of browser alert
          alert(
            `Polygons must have between 3 and 12 vertices. Yours has ${latlngs.length}.`
          );
          map.removeLayer(layer);
          return;
        }

        // 2. Convert coordinates for storing
        const coordinates: [number, number][] = latlngs.map((latlng) => [
          latlng.lat,
          latlng.lng,
        ]);

        // Close the polygon by adding the first point at the end for proper polygon storage
        if (coordinates.length > 0) {
          coordinates.push(coordinates[0]);
        }

        // 3. Open modal for name input instead of prompt
        setModalState({
          isOpen: true,
          layer,
          coordinates,
          vertexCount: latlngs.length,
        });
      }
    };

    // --- Event Listener for REMOVING Polygons ---
    const handleRemove = (e: GeomanRemoveEvent) => {
      console.log("🔥 GeomanController: pm:remove event", e);
      const { layer } = e;

      if (
        layer instanceof L.Polygon &&
        (layer as ExtendedLayer).isCustomPolygon
      ) {
        const polygonId = (layer as ExtendedLayer)._polygonId;
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
    const handleMarkerdragend = (e: L.LeafletEvent) => {
      console.log("🔥 GeomanController: pm:markerdragend event", e);
      // This should fire when vertex dragging ends
      handleEdit(e as GeomanEditEvent);
    };

    // Add all event listeners
    map.on("pm:create", handleCreate);
    map.on("pm:edit", handleEdit);
    map.on("pm:remove", handleRemove);
    map.on("pm:markerdragend", handleMarkerdragend);

    // Additional events that might be useful
    map.on("pm:editstart", (e: L.LeafletEvent) =>
      console.log("🔥 Edit started", e)
    );
    map.on("pm:editend", (e: L.LeafletEvent) =>
      console.log("🔥 Edit ended", e)
    );

    // console.log("GeomanController: All event listeners registered");

    // Cleanup function
    return () => {
      // console.log("GeomanController: Cleaning up event listeners");
      map.off("pm:create", handleCreate);
      map.off("pm:edit", handleEdit);
      map.off("pm:remove", handleRemove);
      map.off("pm:markerdragend", handleMarkerdragend);
      map.off("pm:editstart");
      map.off("pm:editend");
    };
  }, [
    map,
    addPolygon,
    updatePolygon,
    polygons,
    dataSources,
    timeline,
    activeDataSourceId,
    handleEdit,
  ]);

  // Separate effect to handle editing state changes
  useEffect(() => {
    if (!map) return;

    // Enable/disable editing for all polygon layers based on editingPolygon state
    map.eachLayer((layer: L.Layer) => {
      if (
        layer instanceof L.Polygon &&
        (layer as ExtendedLayer)._polygonId &&
        (layer as ExtendedLayer).isCustomPolygon
      ) {
        const polygonId = (layer as ExtendedLayer)._polygonId;

        if (editingPolygon === polygonId) {
          // console.log(`Enabling editing for polygon ${polygonId}`);
          layer.pm.enable();
        } else {
          // console.log(`Disabling editing for polygon ${polygonId}`);
          layer.pm.disable();
        }
      }
    });
  }, [map, editingPolygon]);

  return (
    <>
      <PolygonNameModal
        isOpen={modalState.isOpen}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        defaultName={`Polygon ${polygons.length + 1}`}
        vertexCount={modalState.vertexCount}
      />
    </>
  );
}
