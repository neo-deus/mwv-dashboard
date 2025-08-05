/**
 * Service for handling polygon weather data and dynamic coloring
 */

import { calculatePolygonCentroid } from "@/utils/polygonUtils";
import {
  fetchWeatherDataWithRetry,
  fetchCompleteWeatherTimeSeries,
} from "@/services/weatherService";
import { applyRules } from "@/utils/colorRules";
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

    // Apply color rules based on the data source type
    let dynamicColor: string;
    let weatherValue: number;

    if (dataSource.id === "temperature") {
      weatherValue = weatherData.temperature;
      console.log(
        `🌡️ Using temperature: ${weatherValue}°C for polygon ${polygon.name}`
      );
    } else if (dataSource.id === "windspeed") {
      weatherValue = weatherData.windSpeed || 0;
      console.log(
        `💨 Using wind speed: ${weatherValue} km/h for polygon ${polygon.name}`
      );
    } else {
      console.warn(
        `Unknown data source: ${dataSource.id}, defaulting to temperature`
      );
      weatherValue = weatherData.temperature;
    }

    console.log(
      `🎨 Applying rules to value ${weatherValue} for data source ${dataSource.id}`
    );
    dynamicColor = applyRules(weatherValue, dataSource.rules);
    console.log(`🎨 Result color: ${dynamicColor}`);

    // Return updated polygon with weather data and dynamic color
    const updatedPolygon: Polygon = {
      ...polygon,
      color: dynamicColor,
      weatherData: {
        temperature: weatherData.temperature,
        windSpeed: weatherData.windSpeed || 0, // Store wind speed, default to 0 if undefined
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
  // Temporarily commented out for debugging - always refresh
  if (!forceRefresh && !isWeatherDataStale(polygon.weatherData)) {
    console.log(
      `Weather data for polygon ${polygon.name} is still fresh, skipping refresh`
    );
    return polygon;
  }

  console.log(`🔄 Refreshing weather data for polygon ${polygon.name}`);

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
 * Get weather value for a specific timestamp from polygon's time series data
 * @param polygon Polygon with time series data
 * @param targetTimestamp Target timestamp to get weather data for
 * @param dataSource Data source to determine which weather parameter to extract
 * @returns Weather value at the specified time, or null if not found
 */
export function getWeatherValueAtTime(
  polygon: Polygon,
  targetTimestamp: Date,
  dataSource: DataSource
): number | null {
  console.log(
    `🔍 Getting weather value for polygon ${polygon.name}, data source: ${
      dataSource.id
    }, timestamp: ${targetTimestamp.toISOString()}`
  );

  if (!polygon.timeSeriesData || !polygon.timeSeriesData.data.length) {
    console.log(`❌ No time series data available for polygon ${polygon.name}`);
    return null;
  }

  console.log(
    `📊 Time series data available: ${polygon.timeSeriesData.data.length} data points`
  );

  const targetTime = targetTimestamp.getTime();

  // Find the closest data point to the target timestamp that has valid data
  let closestDataPoint = null;
  let minTimeDiff = Infinity;

  for (const dataPoint of polygon.timeSeriesData.data) {
    // Skip data points with null/undefined values
    const hasValidTemperature = dataPoint.temperature != null;
    const hasValidWindSpeed = dataPoint.windSpeed != null;

    // Skip if the requested data type is not available
    if (dataSource.id === "temperature" && !hasValidTemperature) {
      continue;
    }
    if (dataSource.id === "windspeed" && !hasValidWindSpeed) {
      continue;
    }

    const timeDiff = Math.abs(
      new Date(dataPoint.timestamp).getTime() - targetTime
    );

    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestDataPoint = dataPoint;
    }
  }

  if (!closestDataPoint) {
    console.log(`❌ No valid data points found for ${dataSource.id}`);
    return null;
  }

  console.log(`🎯 Closest valid data point:`, {
    timestamp: closestDataPoint.timestamp,
    temperature: closestDataPoint.temperature,
    windSpeed: closestDataPoint.windSpeed,
    timeDiff: minTimeDiff / (60 * 1000), // in minutes
  });

  // Only return value if the closest point is within 2 hours of target (increased tolerance)
  if (minTimeDiff <= 2 * 60 * 60 * 1000) {
    // 2 hours in milliseconds
    if (dataSource.id === "temperature") {
      console.log(`🌡️ Returning temperature: ${closestDataPoint.temperature}`);
      return closestDataPoint.temperature;
    } else if (dataSource.id === "windspeed") {
      console.log(`💨 Returning wind speed: ${closestDataPoint.windSpeed}`);
      console.log(`💨 Wind speed type: ${typeof closestDataPoint.windSpeed}`);
      console.log(
        `💨 Wind speed is null/undefined: ${closestDataPoint.windSpeed == null}`
      );
      return closestDataPoint.windSpeed;
    }
  } else {
    console.log(
      `⏰ Closest valid data point too far from target time: ${
        minTimeDiff / (60 * 1000)
      } minutes`
    );
  }

  return null;
}

/**
 * Update polygon color based on weather data at a specific time
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
  console.log(
    `🔧 updatePolygonColorForTime called for polygon ${polygon.name} with data source ${dataSource.id}`
  );
  console.log(`📅 Target timestamp: ${targetTimestamp.toISOString()}`);
  console.log(`📊 Polygon has time series data:`, !!polygon.timeSeriesData);
  if (polygon.timeSeriesData) {
    console.log(
      `📈 Time series data points: ${polygon.timeSeriesData.data.length}`
    );
  }

  const weatherValue = getWeatherValueAtTime(
    polygon,
    targetTimestamp,
    dataSource
  );

  if (weatherValue === null) {
    console.warn(
      `No ${dataSource.name.toLowerCase()} data found for polygon ${
        polygon.name
      } at ${targetTimestamp.toISOString()}`
    );
    return {
      ...polygon,
      color: "#9ca3af", // Gray fallback color
    };
  }

  const dynamicColor = applyRules(weatherValue, dataSource.rules);

  return {
    ...polygon,
    color: dynamicColor,
    weatherData: {
      temperature:
        dataSource.id === "temperature"
          ? weatherValue
          : polygon.weatherData?.temperature || 0,
      windSpeed:
        dataSource.id === "windspeed"
          ? weatherValue
          : polygon.weatherData?.windSpeed || 0,
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
