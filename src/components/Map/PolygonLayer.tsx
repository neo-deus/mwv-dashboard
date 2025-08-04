"use client";

import { Polygon, Popup } from "react-leaflet";
import { useDashboardStore } from "@/stores/dashboardStore";
import { LatLngExpression } from "leaflet";
import { useRef } from "react";

export function PolygonLayer() {
  const { polygons, removePolygon, setSelectedPolygon } = useDashboardStore();

  return (
    <>
      {polygons.map((polygon) => {
        // react-leaflet's <Polygon> component expects LatLngExpression
        const latlngs: LatLngExpression[] = polygon.coordinates.map(
          (coord) => [coord[0], coord[1]] as [number, number]
        );

        return (
          <Polygon
            key={polygon.id}
            positions={latlngs}
            pathOptions={{
              color: polygon.color,
              fillColor: polygon.color,
              fillOpacity: 0.5,
              weight: 2,
            }}
            // Event handler for when a polygon is clicked
            eventHandlers={{
              click: () => {
                setSelectedPolygon(polygon.id);
              },
            }}
            // This `ref` is the magic link!
            // We attach our internal polygon ID to the Leaflet layer instance.
            // Now, when Geoman fires an 'edit' event on this layer, we can identify it.
            ref={(layer) => {
              if (layer) {
                (layer as any)._polygonId = polygon.id;
              }
            }}
          >
            <Popup>
              <div className="flex flex-col space-y-2">
                <h3 className="font-semibold">{polygon.name}</h3>
                <p className="text-sm">Data Source: {polygon.dataSource}</p>
                <p className="text-sm">Points: {polygon.coordinates.length - 1}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent map click events
                    if (window.confirm(`Delete "${polygon.name}"?`)) {
                        removePolygon(polygon.id);
                    }
                  }}
                  className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}