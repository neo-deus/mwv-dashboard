/**
 * Service for handling polygon weather data and dynamic coloring
 */

import { calculatePolygonCentroid } from "@/utils/polygonUtils";
import {
  fetchWeatherDataWithRetry,
  fetchCompleteWeatherTimeSeries,
} from "@/services/weatherService";
import { getTemperatureColor } from "@/utils/colorRules";
import type { Polygon, DataSource } from "@/types";

/**
 * Fetch weather data for a polygon and update its color based on temperature rules
 * @param polygon The polygon to fetch weather data for
 * @param dataSource The data source containing the temperature rules
 * @returns Updated polygon with weather data and dynamic color
 */
export async function fetchPolygonWeatherData(
  polygon: Polygon,
  dataSource: DataSource
): Promise<Polygon> {
  try {
    // Calculate centroid for weather API call
    const centroid = calculatePolygonCentroid(polygon.coordinates);
    const [lat, lng] = centroid;

    console.log(
      `Fetching weather for polygon ${polygon.name} at centroid: ${lat}, ${lng}`
    );

    // Fetch weather data
    const weatherData = await fetchWeatherDataWithRetry(lat, lng);

    // Apply color rules based on temperature
    const dynamicColor = getTemperatureColor(
      weatherData.temperature,
      dataSource
    );

    // Return updated polygon with weather data and dynamic color
    const updatedPolygon: Polygon = {
      ...polygon,
      color: dynamicColor,
      weatherData: {
        temperature: weatherData.temperature,
        timestamp: weatherData.timestamp,
        centroid: centroid,
      },
    };

    console.log(
      `Weather data applied to polygon ${polygon.name}: ${weatherData.temperature}°C -> ${dynamicColor}`
    );

    return updatedPolygon;
  } catch (error) {
    console.error(
      `Failed to fetch weather data for polygon ${polygon.name}:`,
      error
    );

    // Return polygon with fallback color if weather fetch fails
    return {
      ...polygon,
      color: "#9ca3af", // Gray fallback color
      weatherData: undefined, // Clear any existing weather data
    };
  }
}

/**
 * Batch fetch weather data for multiple polygons
 * @param polygons Array of polygons
 * @param dataSource The data source with temperature rules
 * @param concurrency Maximum number of concurrent API calls
 * @returns Promise array of updated polygons
 */
export async function fetchMultiplePolygonWeatherData(
  polygons: Polygon[],
  dataSource: DataSource,
  concurrency: number = 3
): Promise<Polygon[]> {
  const results: Polygon[] = [];

  // Process polygons in batches to avoid overwhelming the API
  for (let i = 0; i < polygons.length; i += concurrency) {
    const batch = polygons.slice(i, i + concurrency);

    const batchPromises = batch.map((polygon) =>
      fetchPolygonWeatherData(polygon, dataSource)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to be respectful to the API
    if (i + concurrency < polygons.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Check if weather data is stale and needs refresh
 * @param weatherData Weather data to check
 * @param maxAgeMinutes Maximum age in minutes before data is considered stale
 * @returns true if data is stale or missing
 */
export function isWeatherDataStale(
  weatherData?: Polygon["weatherData"],
  maxAgeMinutes: number = 30
): boolean {
  if (!weatherData || !weatherData.timestamp) {
    return true;
  }

  const dataTime = new Date(weatherData.timestamp);
  const now = new Date();
  const ageMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);

  return ageMinutes > maxAgeMinutes;
}

/**
 * Refresh weather data for a polygon if it's stale
 * @param polygon Polygon to potentially refresh
 * @param dataSource Data source with rules
 * @param forceRefresh Force refresh even if data is fresh
 * @param includeTimeSeries Whether to also refresh time series data for timeline functionality
 * @returns Updated polygon or original if refresh not needed
 */
export async function refreshPolygonWeatherIfStale(
  polygon: Polygon,
  dataSource: DataSource,
  forceRefresh: boolean = false,
  includeTimeSeries: boolean = true
): Promise<Polygon> {
  if (!forceRefresh && !isWeatherDataStale(polygon.weatherData)) {
    console.log(
      `Weather data for polygon ${polygon.name} is still fresh, skipping refresh`
    );
    return polygon;
  }

  console.log(`Refreshing weather data for polygon ${polygon.name}`);

  if (includeTimeSeries) {
    console.log(`Also refreshing time series data for timeline functionality`);

    // Fetch both current weather and time series data
    const [updatedPolygon, polygonWithTimeSeries] = await Promise.all([
      fetchPolygonWeatherData(polygon, dataSource),
      fetchPolygonTimeSeries(polygon),
    ]);

    // Combine both updates
    return {
      ...updatedPolygon,
      timeSeriesData: polygonWithTimeSeries.timeSeriesData,
    };
  } else {
    // Only fetch current weather data
    return await fetchPolygonWeatherData(polygon, dataSource);
  }
}

/**
 * Fetch complete time series data for a polygon (15 days past + 15 days forecast)
 * @param polygon The polygon to fetch time series data for
 * @returns Updated polygon with time series data
 */
export async function fetchPolygonTimeSeries(
  polygon: Polygon
): Promise<Polygon> {
  try {
    // Calculate centroid for weather API call
    const centroid = calculatePolygonCentroid(polygon.coordinates);
    const [lat, lng] = centroid;

    console.log(
      `Fetching time series data for polygon ${polygon.name} at centroid: ${lat}, ${lng}`
    );

    // Fetch complete time series data
    const timeSeriesData = await fetchCompleteWeatherTimeSeries(lat, lng);

    // Return updated polygon with time series data
    const updatedPolygon: Polygon = {
      ...polygon,
      timeSeriesData: {
        data: timeSeriesData,
        lastUpdated: new Date().toISOString(),
        centroid: centroid,
      },
    };

    console.log(
      `Time series data fetched for polygon ${polygon.name}: ${timeSeriesData.length} data points`
    );

    return updatedPolygon;
  } catch (error) {
    console.error(
      `Failed to fetch time series data for polygon ${polygon.name}:`,
      error
    );

    // Return polygon without time series data if fetch fails
    return {
      ...polygon,
      timeSeriesData: undefined,
    };
  }
}

/**
 * Get temperature for a specific timestamp from polygon's time series data
 * @param polygon Polygon with time series data
 * @param targetTimestamp Target timestamp to get temperature for
 * @returns Temperature at the specified time, or null if not found
 */
export function getTemperatureAtTime(
  polygon: Polygon,
  targetTimestamp: Date
): number | null {
  if (!polygon.timeSeriesData || !polygon.timeSeriesData.data.length) {
    return null;
  }

  const targetTime = targetTimestamp.getTime();

  // Find the closest data point to the target timestamp
  let closestDataPoint = polygon.timeSeriesData.data[0];
  let minTimeDiff = Math.abs(
    new Date(closestDataPoint.timestamp).getTime() - targetTime
  );

  for (const dataPoint of polygon.timeSeriesData.data) {
    const timeDiff = Math.abs(
      new Date(dataPoint.timestamp).getTime() - targetTime
    );
    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestDataPoint = dataPoint;
    }
  }

  // Only return temperature if the closest point is within 1 hour of target
  if (minTimeDiff <= 60 * 60 * 1000) {
    // 1 hour in milliseconds
    return closestDataPoint.temperature;
  }

  return null;
}

/**
 * Update polygon color based on temperature at a specific time
 * @param polygon Polygon to update
 * @param targetTimestamp Target timestamp
 * @param dataSource Data source with color rules
 * @returns Updated polygon with color for the specified time
 */
export function updatePolygonColorForTime(
  polygon: Polygon,
  targetTimestamp: Date,
  dataSource: DataSource
): Polygon {
  const temperature = getTemperatureAtTime(polygon, targetTimestamp);

  if (temperature === null) {
    console.warn(
      `No temperature data found for polygon ${
        polygon.name
      } at ${targetTimestamp.toISOString()}`
    );
    return {
      ...polygon,
      color: "#9ca3af", // Gray fallback color
    };
  }

  const dynamicColor = getTemperatureColor(temperature, dataSource);

  return {
    ...polygon,
    color: dynamicColor,
    weatherData: {
      temperature: temperature,
      timestamp: targetTimestamp.toISOString(),
      centroid: polygon.timeSeriesData?.centroid || [0, 0],
    },
  };
}

/**
 * Check if time series data is stale and needs refresh
 * @param timeSeriesData Time series data to check
 * @param maxAgeHours Maximum age in hours before data is considered stale
 * @returns true if data is stale or missing
 */
export function isTimeSeriesDataStale(
  timeSeriesData?: Polygon["timeSeriesData"],
  maxAgeHours: number = 6
): boolean {
  if (!timeSeriesData || !timeSeriesData.lastUpdated) {
    return true;
  }

  const dataTime = new Date(timeSeriesData.lastUpdated);
  const now = new Date();
  const ageHours = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60);

  return ageHours > maxAgeHours;
}
