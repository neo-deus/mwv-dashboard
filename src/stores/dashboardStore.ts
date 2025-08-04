import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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

  // Data source actions
  addDataSource: (dataSource: Omit<DataSource, "id">) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;

  // Map actions
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setMapBounds: (bounds: [[number, number], [number, number]]) => void;

  // Drawing actions
  setIsDrawing: (drawing: boolean) => void;

  // Reset actions
  reset: () => void;
}

// Default values
const defaultMapState: MapState = {
  center: [52.52, 13.41], // Berlin coordinates as default
  zoom: 10,
};

const defaultTimelineState: TimelineState = {
  mode: "single",
  selectedTime: null as any, // Will be set on client side
};

const defaultDataSource: DataSource = {
  id: "temperature",
  name: "Temperature",
  field: "temperature_2m",
  rules: [
    { id: "1", operator: "<", value: 10, color: "#3b82f6" }, // Blue for cold
    { id: "2", operator: ">=", value: 10, color: "#22c55e" }, // Green for moderate
    { id: "3", operator: ">=", value: 25, color: "#ef4444" }, // Red for hot
  ],
};

const initialState: DashboardState = {
  polygons: [],
  dataSources: [defaultDataSource],
  timeline: defaultTimelineState,
  map: defaultMapState,
  isDrawing: false,
  editingPolygon: undefined,
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

        // Data source actions
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
