// Core types for the dashboard application

export interface Polygon {
  id: string;
  name: string;
  coordinates: [number, number][];
  dataSource: string;
  color: string;
  createdAt: Date | string; // Allow both Date objects and date strings (for persistence)
}

export interface DataSource {
  id: string;
  name: string;
  field: string;
  rules: ColorRule[];
}

export interface ColorRule {
  id: string;
  operator: "=" | "<" | ">" | "<=" | ">=";
  value: number;
  color: string;
}

export interface TimelineState {
  mode: "single" | "range";
  selectedTime: Date;
  startTime?: Date;
  endTime?: Date;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

export interface MapState {
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
}

export interface DashboardState {
  polygons: Polygon[];
  dataSources: DataSource[];
  timeline: TimelineState;
  map: MapState;
  isDrawing: boolean;
  selectedPolygon?: string;
  editingPolygon?: string; // ID of polygon currently being edited
}
