/**
 * Weather service for fetching data from Open-Meteo API
 */

export interface WeatherData {
  temperature: number;
  humidity?: number;
  windSpeed?: number;
  timestamp: string;
}

export interface TimeSeriesWeatherData {
  timestamp: string;
  temperature: number;
  windSpeed: number;
}

export interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
    time: string;
  };
}

export interface OpenMeteoHistoricalResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    windspeed_10m: number[];
  };
}

export interface OpenMeteoForecastResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    windspeed_10m: number[];
  };
}

/**
 * Fetch current weather data from Open-Meteo API
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise<WeatherData>
 */
export async function fetchWeatherData(
  lat: number,
  lng: number
): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`;

    console.log(`Fetching weather data for coordinates: ${lat}, ${lng}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Weather API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: OpenMeteoResponse = await response.json();

    const weatherData: WeatherData = {
      temperature: data.current_weather.temperature,
      windSpeed: data.current_weather.windspeed,
      timestamp: data.current_weather.time,
    };

    console.log(`Weather data fetched successfully:`, weatherData);

    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw new Error(
      `Failed to fetch weather data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch weather data with retry mechanism
 * @param lat Latitude
 * @param lng Longitude
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise<WeatherData>
 */
export async function fetchWeatherDataWithRetry(
  lat: number,
  lng: number,
  maxRetries: number = 3
): Promise<WeatherData> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWeatherData(lat, lng);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.warn(
        `Weather data fetch attempt ${attempt} failed:`,
        lastError.message
      );

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Fetch historical weather data (past 15 days)
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise<TimeSeriesWeatherData[]>
 */
export async function fetchHistoricalWeatherData(
  lat: number,
  lng: number
): Promise<TimeSeriesWeatherData[]> {
  try {
    // Calculate date range: 15 days ago to today
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 15);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDateStr}&end_date=${endDateStr}&hourly=temperature_2m,windspeed_10m&timezone=auto`;

    console.log(
      `📅 Fetching historical weather data for coordinates: ${lat}, ${lng} from ${startDateStr} to ${endDateStr}`
    );

    const response = await fetch(url);

    console.log(response);

    console.log(`📞 Historical API response:`, {
      status: response.status,
      statusText: response.statusText,
      url: url,
    });

    if (!response.ok) {
      throw new Error(
        `Historical weather API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: OpenMeteoHistoricalResponse = await response.json();

    // Convert to our format
    const weatherData: TimeSeriesWeatherData[] = data.hourly.time.map(
      (time, index) => ({
        timestamp: time,
        temperature: data.hourly.temperature_2m[index],
        windSpeed: data.hourly.windspeed_10m[index],
      })
    );

    console.log(
      `Historical weather data fetched successfully: ${weatherData.length} data points`
    );

    return weatherData;
  } catch (error) {
    console.error("Error fetching historical weather data:", error);
    throw new Error(
      `Failed to fetch historical weather data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch forecast weather data (next 15 days)
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise<TimeSeriesWeatherData[]>
 */
export async function fetchForecastWeatherData(
  lat: number,
  lng: number
): Promise<TimeSeriesWeatherData[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,windspeed_10m&forecast_days=15&timezone=auto`;

    console.log(
      `🔮 Fetching forecast weather data for coordinates: ${lat}, ${lng} for next 15 days`
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Forecast weather API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: OpenMeteoForecastResponse = await response.json();

    // Convert to our format
    const weatherData: TimeSeriesWeatherData[] = data.hourly.time.map(
      (time, index) => ({
        timestamp: time,
        temperature: data.hourly.temperature_2m[index],
        windSpeed: data.hourly.windspeed_10m[index],
      })
    );

    console.log(
      `Forecast weather data fetched successfully: ${weatherData.length} data points`
    );

    return weatherData;
  } catch (error) {
    console.error("Error fetching forecast weather data:", error);
    throw new Error(
      `Failed to fetch forecast weather data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch complete time series data (15 days past + 15 days forecast)
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise<TimeSeriesWeatherData[]>
 */
export async function fetchCompleteWeatherTimeSeries(
  lat: number,
  lng: number
): Promise<TimeSeriesWeatherData[]> {
  try {
    console.log(
      `🔍 Starting complete weather time series fetch for coordinates: ${lat}, ${lng}`
    );

    const [historicalData, forecastData] = await Promise.all([
      fetchHistoricalWeatherData(lat, lng),
      fetchForecastWeatherData(lat, lng),
    ]);

    console.log(`📊 Historical data points: ${historicalData.length}`);
    console.log(`📈 Forecast data points: ${forecastData.length}`);

    // Combine historical and forecast data
    const completeData = [...historicalData, ...forecastData];

    // Sort by timestamp to ensure correct order
    completeData.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log(
      `✅ Complete weather time series fetched: ${completeData.length} data points total`
    );

    return completeData;
  } catch (error) {
    console.error("❌ Error fetching complete weather time series:", error);
    throw new Error(
      `Failed to fetch complete weather time series: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
