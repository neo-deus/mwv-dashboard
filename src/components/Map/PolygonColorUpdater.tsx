/**
 * Component that listens to polygon color changes and updates map visuals
 */
"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import * as L from "leaflet";

export function PolygonColorUpdater() {
  const map = useMap();
  const { polygons } = useDashboardStore();

  useEffect(() => {
    if (!map) return;

    // Update all polygon layer colors when polygons change
    map.eachLayer((layer: any) => {
      if (
        layer instanceof L.Polygon &&
        (layer as any)._polygonId &&
        (layer as any).isCustomPolygon
      ) {
        const polygonId = (layer as any)._polygonId;
        const polygon = polygons.find((p) => p.id === polygonId);

        if (polygon) {
          // Update layer style to match the current polygon color
          layer.setStyle({
            color: polygon.color,
            fillColor: polygon.color,
            fillOpacity: 0.5,
            weight: 2,
          });

          // Update popup content if it exists and has weather data
          if (polygon.weatherData) {
            const weatherInfo = `
              <p style="margin: 4px 0; font-weight: bold; color: ${
                polygon.color
              };">
                Temperature: ${polygon.weatherData.temperature.toFixed(1)}°C
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                Time: ${new Date(
                  polygon.weatherData.timestamp
                ).toLocaleString()}
              </p>`;

            const popup = layer.getPopup();
            if (popup) {
              const updatedContent = `
                <div>
                  <h3 style="font-weight: bold; margin: 0 0 8px 0;">${
                    polygon.name
                  }</h3>
                  <p style="margin: 4px 0;">Data Source: ${
                    polygon.dataSource
                  }</p>
                  <p style="margin: 4px 0;">Points: ${
                    polygon.coordinates.length - 1
                  }</p>
                  ${weatherInfo}
                  <button 
                    onclick="window.deletePolygon('${polygon.id}')" 
                    style="margin-top: 8px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
                  >
                    Delete
                  </button>
                </div>
              `;
              popup.setContent(updatedContent);
            }
          }

          console.log(
            `Updated layer color for polygon ${polygonId} to ${polygon.color}`
          );
        }
      }
    });
  }, [polygons, map]);

  return null; // This component only handles side effects
}
