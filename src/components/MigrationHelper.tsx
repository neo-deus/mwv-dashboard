"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

/**
 * Component that handles data migrations for the dashboard store
 * This ensures that new data sources are added to existing localStorage data
 */
export function MigrationHelper() {
  const { migrateDataSources, dataSources } = useDashboardStore();

  useEffect(() => {
    // Check if we need to migrate data sources
    const hasWindSpeed = dataSources.some((ds) => ds.id === "windspeed");

    if (!hasWindSpeed) {
      console.log("🔄 Running data source migration...");
      migrateDataSources();
    } else {
      console.log("✅ Data sources are up to date");
    }
  }, [migrateDataSources, dataSources]);

  return null; // This component only handles side effects
}
