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

      if (latlngs.length < 3 || latlngs.length > 12) {
        alert(
          `Polygons must have between 3 and 12 vertices. Yours has ${latlngs.length}. Edit rejected.`
        );

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

      if (newCoordinates.length > 0) {
        newCoordinates.push(newCoordinates[0]);
      }

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
    const newPolygon = addPolygon({
      name,
      coordinates,
      dataSource: activeDataSourceId,
      color: "#9ca3af",
    });

    (layer as ExtendedLayer)._polygonId = newPolygon.id;
    (layer as ExtendedLayer).isCustomPolygon = true;

    layer.setStyle({
      color: "#9ca3af",
      fillColor: "#9ca3af",
      fillOpacity: 0.3,
      weight: 2,
    });

    const activeDataSource = dataSources.find(
      (ds) => ds.id === activeDataSourceId
    );
    if (activeDataSource) {
      console.log(
        `Fetching ${activeDataSource.name.toLowerCase()} data and time series for new polygon: ${
          newPolygon.name
        }`
      );

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

          updatePolygon(updatedPolygon.id, {
            color: updatedPolygon.color,
            weatherData: updatedPolygon.weatherData,
            timeSeriesData: polygonWithTimeSeries.timeSeriesData,
          });

          layer.setStyle({
            color: updatedPolygon.color,
            fillColor: updatedPolygon.color,
            fillOpacity: 0.5,
            weight: 2,
          });

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
        });
    } else {
      console.warn("Temperature data source not found, using default color");
    }

    layer.pm.disable();

    layer.on("click", () => {
      console.log(`Polygon ${newPolygon.id} clicked - setting as selected`);
      const { setSelectedPolygon } = useDashboardStore.getState();
      setSelectedPolygon(newPolygon.id);
    });

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

    (
      map as L.Map & { pm: { setGlobalOptions: (options: unknown) => void } }
    ).pm.setGlobalOptions({
      pinning: true,
      snappable: true,
    });

    const handleCreate = (e: GeomanCreateEvent) => {
      console.log("🔥 GeomanController: pm:create event", e);
      const { layer } = e;

      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];

        console.log(`New polygon created with ${latlngs.length} vertices`);

        if (latlngs.length < 3 || latlngs.length > 12) {
          alert(
            `Polygons must have between 3 and 12 vertices. Yours has ${latlngs.length}.`
          );
          map.removeLayer(layer);
          return;
        }

        const coordinates: [number, number][] = latlngs.map((latlng) => [
          latlng.lat,
          latlng.lng,
        ]);

        if (coordinates.length > 0) {
          coordinates.push(coordinates[0]);
        }

        setModalState({
          isOpen: true,
          layer,
          coordinates,
          vertexCount: latlngs.length,
        });
      }
    };

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
          layer.addTo(map);
          alert(
            "Please use the delete button in the polygon list to remove shapes."
          );
        }
      }
    };

    const handleMarkerdragend = (e: L.LeafletEvent) => {
      console.log("🔥 GeomanController: pm:markerdragend event", e);
      handleEdit(e as GeomanEditEvent);
    };

    map.on("pm:create", handleCreate);
    map.on("pm:edit", handleEdit);
    map.on("pm:remove", handleRemove);
    map.on("pm:markerdragend", handleMarkerdragend);

    map.on("pm:editstart", (e: L.LeafletEvent) =>
      console.log("🔥 Edit started", e)
    );
    map.on("pm:editend", (e: L.LeafletEvent) =>
      console.log("🔥 Edit ended", e)
    );

    return () => {
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

  useEffect(() => {
    if (!map) return;

    map.eachLayer((layer: L.Layer) => {
      if (
        layer instanceof L.Polygon &&
        (layer as ExtendedLayer)._polygonId &&
        (layer as ExtendedLayer).isCustomPolygon
      ) {
        const polygonId = (layer as ExtendedLayer)._polygonId;

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
