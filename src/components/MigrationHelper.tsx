"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

export function MigrationHelper() {
  const { migrateDataSources, dataSources } = useDashboardStore();

  useEffect(() => {
    const hasWindSpeed = dataSources.some((ds) => ds.id === "windspeed");

    if (!hasWindSpeed) {
      console.log("🔄 Running data source migration...");
      migrateDataSources();
    } else {
      console.log("✅ Data sources are up to date");
    }
  }, [migrateDataSources, dataSources]);

  return null;
}
