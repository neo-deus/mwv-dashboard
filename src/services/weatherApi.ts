import axios from "axios";
import type { WeatherData } from "@/types";

const OPEN_METEO_BASE_URL = "https://archive-api.open-meteo.com/v1/archive";

export interface WeatherQueryParams {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  hourly: string[]; // Array of variables like ['temperature_2m']
}

export const weatherApi = {
  /**
   * Fetch weather data from Open-Meteo API
   */
  async fetchWeatherData(params: WeatherQueryParams): Promise<WeatherData> {
    try {
      const response = await axios.get(OPEN_METEO_BASE_URL, {
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
          start_date: params.startDate,
          end_date: params.endDate,
          hourly: params.hourly.join(","),
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw new Error("Failed to fetch weather data");
    }
  },

  /**
   * Get weather data for a specific polygon centroid
   */
  async getPolygonWeatherData(
    coordinates: [number, number][],
    startDate: string,
    endDate: string,
    variables: string[] = ["temperature_2m"]
  ): Promise<WeatherData> {
    // Calculate centroid of polygon
    const centroid = this.calculateCentroid(coordinates);

    return this.fetchWeatherData({
      latitude: centroid[0],
      longitude: centroid[1],
      startDate,
      endDate,
      hourly: variables,
    });
  },

  /**
   * Calculate centroid of a polygon
   */
  calculateCentroid(coordinates: [number, number][]): [number, number] {
    if (coordinates.length === 0) {
      return [0, 0];
    }

    const sum = coordinates.reduce(
      (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
      [0, 0]
    );

    return [sum[0] / coordinates.length, sum[1] / coordinates.length];
  },

  /**
   * Get weather value for a specific hour
   */
  getValueForHour(
    weatherData: WeatherData,
    targetHour: Date,
    field: string
  ): number | null {
    const targetISOString = targetHour.toISOString();
    const hourIndex = weatherData.hourly.time.findIndex(
      (time) => new Date(time).toISOString() === targetISOString
    );

    if (hourIndex === -1) {
      return null;
    }

    const fieldData = (weatherData.hourly as any)[field];
    return fieldData ? fieldData[hourIndex] : null;
  },

  /**
   * Format date for API calls (YYYY-MM-DD)
   */
  formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  },

  /**
   * Get date range for timeline (15 days before and after today)
   */
  getTimelineRange(): { startDate: string; endDate: string } {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 15);

    const end = new Date(today);
    end.setDate(today.getDate() + 15);

    return {
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
    };
  },
};
