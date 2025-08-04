// Debug script to check polygon time series data
// Run this in the browser console to debug wind speed data

// Get the store data
const storeData = JSON.parse(
  localStorage.getItem("mwv-dashboard-store") || "{}"
);
console.log("🔍 Store data:", storeData);

if (storeData.state && storeData.state.polygons) {
  const polygons = storeData.state.polygons;
  console.log(`📊 Found ${polygons.length} polygons`);

  polygons.forEach((polygon, index) => {
    console.log(`\n🔺 Polygon ${index + 1}: ${polygon.name}`);
    console.log(`📍 Data source: ${polygon.dataSource}`);
    console.log(`🎨 Color: ${polygon.color}`);

    if (polygon.timeSeriesData) {
      console.log(
        `📈 Time series data: ${polygon.timeSeriesData.data.length} points`
      );

      // Check first few data points
      const firstFew = polygon.timeSeriesData.data.slice(0, 3);
      firstFew.forEach((point, i) => {
        console.log(`  Point ${i + 1}:`, {
          timestamp: point.timestamp,
          temperature: point.temperature,
          windSpeed: point.windSpeed,
        });
      });

      // Check if wind speed data exists
      const hasWindSpeed = polygon.timeSeriesData.data.some(
        (point) => point.windSpeed !== undefined && point.windSpeed !== null
      );
      console.log(`💨 Has wind speed data: ${hasWindSpeed}`);

      if (hasWindSpeed) {
        const windSpeeds = polygon.timeSeriesData.data
          .map((p) => p.windSpeed)
          .filter((w) => w !== undefined && w !== null);
        console.log(
          `💨 Wind speed range: ${Math.min(...windSpeeds).toFixed(
            1
          )} - ${Math.max(...windSpeeds).toFixed(1)} km/h`
        );
      }
    } else {
      console.log(`❌ No time series data`);
    }

    if (polygon.weatherData) {
      console.log(`🌤️ Current weather:`, {
        temperature: polygon.weatherData.temperature,
        windSpeed: polygon.weatherData.windSpeed,
        timestamp: polygon.weatherData.timestamp,
      });
    }
  });
} else {
  console.log("❌ No polygons found in store");
}

// Also check current active data source
if (storeData.state && storeData.state.activeDataSourceId) {
  console.log(`\n🎯 Active data source: ${storeData.state.activeDataSourceId}`);
}

// Check data sources
if (storeData.state && storeData.state.dataSources) {
  console.log(`\n📋 Available data sources:`);
  storeData.state.dataSources.forEach((ds) => {
    console.log(`  - ${ds.id}: ${ds.name} (${ds.rules.length} rules)`);
  });
}
