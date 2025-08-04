"use client";

import { Polygon, Popup } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { useMap } from "react-leaflet";
import { refreshPolygonWeatherIfStale } from "@/services/polygonWeatherService";

export function PolygonRenderer() {
  const {
    polygons,
    removePolygon,
    setSelectedPolygon,
    editingPolygon,
    dataSources,
    updatePolygon,
    activeDataSourceId,
  } = useDashboardStore();
  const layersRef = useRef<{ [key: string]: L.Polygon }>({});
  const map = useMap();

  // Effect to sync Leaflet layers with the Zustand store
  useEffect(() => {
    // console.log("PolygonRenderer: Syncing polygons", polygons.length);

    // Get all existing layers that are managed by Geoman (freshly created)
    const existingGeomanLayers: string[] = [];
    map.eachLayer((layer: any) => {
      if (
        layer instanceof L.Polygon &&
        (layer as any)._polygonId &&
        (layer as any).isCustomPolygon
      ) {
        existingGeomanLayers.push((layer as any)._polygonId);
        // console.log(
        //   `Found existing Geoman layer for polygon: ${
        //     (layer as any)._polygonId
        //   }`
        // );
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
        // console.log(
        //   `PolygonRenderer: Creating restoration layer for ${polygon.id} (${polygon.name})`
        // );

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

        // Check if we need to refresh weather data for this polygon
        const activeDataSource = dataSources.find(
          (ds) => ds.id === activeDataSourceId
        );
        if (activeDataSource && polygon.dataSource === activeDataSourceId) {
          refreshPolygonWeatherIfStale(polygon, activeDataSource, false, true)
            .then((refreshedPolygon) => {
              if (refreshedPolygon.color !== polygon.color) {
                console.log(
                  `Refreshed weather data for ${polygon.name}, updating color to ${refreshedPolygon.color}`
                );
              }

              if (refreshedPolygon.timeSeriesData) {
                // console.log(
                //   `Refreshed time series data for ${polygon.name}: ${refreshedPolygon.timeSeriesData.data.length} data points`
                // );
              }

              updatePolygon(polygon.id, {
                color: refreshedPolygon.color,
                weatherData: refreshedPolygon.weatherData,
                timeSeriesData: refreshedPolygon.timeSeriesData,
              });

              // Update the layer color if it exists
              const existingLayer = layersRef.current[polygon.id];
              if (existingLayer) {
                existingLayer.setStyle({
                  color: refreshedPolygon.color,
                  fillColor: refreshedPolygon.color,
                  fillOpacity: 0.5,
                  weight: 2,
                });
              }
            })
            .catch((error) => {
              console.warn(
                `Failed to refresh weather data for ${polygon.name}:`,
                error
              );
            });
        }

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

        // Helper function to get weather display info
        const getWeatherDisplayInfo = (polygon: any) => {
          if (!polygon.weatherData) return null;

          const dataSource = dataSources.find(
            (ds) => ds.id === polygon.dataSource
          );
          const dataSourceName = dataSource?.name || polygon.dataSource;

          if (polygon.dataSource === "temperature") {
            return {
              label: "Temperature",
              value: polygon.weatherData.temperature.toFixed(1),
              unit: "°C",
            };
          } else if (polygon.dataSource === "windspeed") {
            // Get wind speed from time series data if available
            if (
              polygon.timeSeriesData &&
              polygon.timeSeriesData.data.length > 0
            ) {
              const targetTime = new Date(
                polygon.weatherData.timestamp
              ).getTime();
              let closestPoint = polygon.timeSeriesData.data[0];
              let minDiff = Math.abs(
                new Date(closestPoint.timestamp).getTime() - targetTime
              );

              for (const point of polygon.timeSeriesData.data) {
                const diff = Math.abs(
                  new Date(point.timestamp).getTime() - targetTime
                );
                if (diff < minDiff) {
                  minDiff = diff;
                  closestPoint = point;
                }
              }

              return {
                label: "Wind Speed",
                value: closestPoint.windSpeed.toFixed(1),
                unit: " km/h",
              };
            }

            return {
              label: "Wind Speed",
              value: "0.0",
              unit: " km/h",
            };
          }

          // Fallback to temperature
          return {
            label: "Temperature",
            value: polygon.weatherData.temperature.toFixed(1),
            unit: "°C",
          };
        };

        // Add popup with polygon info including weather data
        const weatherDisplayInfo = getWeatherDisplayInfo(polygon);
        const weatherInfo =
          weatherDisplayInfo && polygon.weatherData
            ? `
            <p style="margin: 4px 0; font-weight: bold; color: ${
              polygon.color
            };">
              ${weatherDisplayInfo.label}: ${weatherDisplayInfo.value}${
                weatherDisplayInfo.unit
              }
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              Updated: ${new Date(
                polygon.weatherData.timestamp
              ).toLocaleTimeString()}
            </p>`
            : `<p style="margin: 4px 0; color: #999;">Weather data loading...</p>`;

        polygonLayer.bindPopup(`
          <div>
            <h3 style="font-weight: bold; margin: 0 0 8px 0;">${polygon.name}</h3>
            <p style="margin: 4px 0;">Data Source: ${polygon.dataSource}</p>
            <p style="margin: 4px 0;">Points: ${coordinates.length}</p>
            ${weatherInfo}
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

        // console.log(
        //   `✅ Restored polygon ${polygon.id} with ${coordinates.length} points and color ${polygon.color}`
        // );
      } else if (hasGeomanLayer) {
        // console.log(
        //   `PolygonRenderer: Skipping ${polygon.id} - already managed by Geoman`
        // );
      }
    });
  }, [
    polygons,
    map,
    removePolygon,
    setSelectedPolygon,
    editingPolygon,
    dataSources,
    updatePolygon,
    activeDataSourceId,
  ]);

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
