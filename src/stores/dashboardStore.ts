import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { updatePolygonColorForTime } from "@/services/polygonWeatherService";
import { getZoomLevelFor2SqKm } from "@/utils/polygonUtils";
import type {
  DashboardState,
  Polygon,
  DataSource,
  TimelineState,
  MapState,
} from "@/types";

interface DashboardStore extends DashboardState {
  // Timeline actions
  setTimelineMode: (mode: "single" | "range") => void;
  setSelectedTime: (time: Date) => void;
  setTimeRange: (start: Date, end: Date) => void;

  // Polygon actions
  addPolygon: (polygon: Omit<Polygon, "id" | "createdAt">) => Polygon;
  removePolygon: (id: string) => void;
  updatePolygon: (id: string, updates: Partial<Polygon>) => void;
  setSelectedPolygon: (id?: string) => void;
  setEditingPolygon: (id?: string) => void;
  updatePolygonColorsForTime: (targetTime: Date) => void;

  // Data source actions
  addDataSource: (dataSource: Omit<DataSource, "id">) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  setActiveDataSource: (dataSourceId: string) => void;

  // Map actions
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setMapBounds: (bounds: [[number, number], [number, number]]) => void;

  // Drawing actions
  setIsDrawing: (drawing: boolean) => void;

  // Reset actions
  reset: () => void;
  migrateDataSources: () => void;
}

// Default values
const defaultMapState: MapState = {
  center: [22.69, 88.47], // Madhyamgram, Kolkata
  zoom: getZoomLevelFor2SqKm(), // Zoom level for 2 sq km resolution
};

const defaultTimelineState: TimelineState = {
  mode: "single",
  selectedTime: null as any,
};

const defaultDataSource: DataSource = {
  id: "temperature",
  name: "Temperature",
  field: "temperature_2m",
  rules: [
    { id: "1", operator: "<", value: 10, color: "#3b82f6" },
    { id: "2", operator: ">=", value: 10, color: "#22c55e" },
    { id: "3", operator: ">=", value: 25, color: "#ef4444" },
  ],
};

const windSpeedDataSource: DataSource = {
  id: "windspeed",
  name: "Wind Speed",
  field: "windspeed_10m",
  rules: [
    { id: "1", operator: "<", value: 10, color: "#10b981" },
    { id: "2", operator: ">=", value: 10, color: "#f59e0b" },
    { id: "3", operator: ">=", value: 15, color: "#ef4444" },
  ],
};

const initialState: DashboardState = {
  polygons: [],
  dataSources: [defaultDataSource, windSpeedDataSource],
  timeline: defaultTimelineState,
  map: defaultMapState,
  isDrawing: false,
  editingPolygon: undefined,
  activeDataSourceId: "temperature",
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Timeline actions
        setTimelineMode: (mode) =>
          set((state) => ({
            timeline: { ...state.timeline, mode },
          })),

        setSelectedTime: (selectedTime) =>
          set((state) => ({
            timeline: { ...state.timeline, selectedTime },
          })),

        setTimeRange: (startTime, endTime) =>
          set((state) => ({
            timeline: { ...state.timeline, startTime, endTime },
          })),

        // Polygon actions
        addPolygon: (polygon: Omit<Polygon, "id" | "createdAt">) => {
          const newPolygon = {
            ...polygon,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          };

          set((state) => ({
            polygons: [...state.polygons, newPolygon],
          }));

          return newPolygon;
        },
        removePolygon: (id) =>
          set((state) => ({
            polygons: state.polygons.filter((p) => p.id !== id),
            selectedPolygon:
              state.selectedPolygon === id ? undefined : state.selectedPolygon,
          })),

        updatePolygon: (id, updates) =>
          set((state) => ({
            polygons: state.polygons.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          })),

        setSelectedPolygon: (id) =>
          set(() => ({
            selectedPolygon: id,
          })),

        setEditingPolygon: (id) =>
          set(() => ({
            editingPolygon: id,
          })),

        updatePolygonColorsForTime: (targetTime) =>
          set((state) => {
            const activeDataSource = state.dataSources.find(
              (ds) => ds.id === state.activeDataSourceId
            );
            if (!activeDataSource) {
              console.warn(
                `Active data source (${state.activeDataSourceId}) not found for color updates`
              );
              return state;
            }

            const updatedPolygons = state.polygons.map((polygon) => {
              if (polygon.timeSeriesData) {
                const updatedPolygon = updatePolygonColorForTime(
                  polygon,
                  targetTime,
                  activeDataSource
                );
                return {
                  ...updatedPolygon,
                  dataSource: state.activeDataSourceId,
                };
              }
              return polygon;
            });

            return {
              polygons: updatedPolygons,
            };
          }),

        addDataSource: (dataSource) =>
          set((state) => ({
            dataSources: [
              ...state.dataSources,
              { ...dataSource, id: crypto.randomUUID() },
            ],
          })),

        updateDataSource: (id, updates) =>
          set((state) => ({
            dataSources: state.dataSources.map((ds) =>
              ds.id === id ? { ...ds, ...updates } : ds
            ),
          })),

        removeDataSource: (id) =>
          set((state) => ({
            dataSources: state.dataSources.filter((ds) => ds.id !== id),
          })),

        setActiveDataSource: (dataSourceId) => {
          console.log(`🔄 Active data source changed to: ${dataSourceId}`);
          set((state) => {
            const newDataSource = state.dataSources.find(
              (ds) => ds.id === dataSourceId
            );
            console.log(`📊 Data source details:`, newDataSource);

            if (newDataSource && state.timeline.selectedTime) {
              console.log(
                `🎨 Updating all polygon colors for new data source: ${dataSourceId}`
              );
            }

            return {
              activeDataSourceId: dataSourceId,
            };
          });
        },

        // Map actions
        setMapCenter: (center) =>
          set((state) => ({
            map: { ...state.map, center },
          })),

        setMapZoom: (zoom) =>
          set((state) => ({
            map: { ...state.map, zoom },
          })),

        setMapBounds: (bounds) =>
          set((state) => ({
            map: { ...state.map, bounds },
          })),

        // Drawing actions
        setIsDrawing: (isDrawing) => set(() => ({ isDrawing })),

        // Reset actions
        reset: () => set(initialState),

        // Migration actions
        migrateDataSources: () =>
          set((state) => {
            const hasWindSpeed = state.dataSources.some(
              (ds) => ds.id === "windspeed"
            );

            if (!hasWindSpeed) {
              console.log("Migrating data sources: Adding Wind Speed");
              return {
                ...state,
                dataSources: [defaultDataSource, windSpeedDataSource],
              };
            }

            return state;
          }),
      }),
      {
        name: "mwv-dashboard-store",
        partialize: (state) => ({
          polygons: state.polygons,
          dataSources: state.dataSources,
          timeline: state.timeline,
        }),
      }
    ),
    { name: "MWV Dashboard Store" }
  )
);
