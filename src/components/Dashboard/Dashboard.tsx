"use client";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimelineSlider } from "@/components/Timeline/TimelineSlider";
import { MapComponent } from "@/components/Map/MapComponent";
import { DataSourceSidebar } from "@/components/Sidebar/DataSourceSidebar";
import { MigrationHelper } from "@/components/MigrationHelper";

export default function Dashboard() {
  return (
    <QueryProvider>
      {/* Migration Helper - runs data migrations on startup */}
      <MigrationHelper />

      <div className="h-screen flex flex-col">
        {/* Header */}
        {/* <header className="border-b bg-background p-3 shrink-0">
          <h1 className="text-xl font-bold">MWV Weather Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Interactive weather data visualization with polygon analysis
          </p>
        </header> */}

        {/* Timeline Slider */}

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Map Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Timeline Slider */}
            <div className="border-b bg-background p-3 shrink-0">
              <TimelineSlider />
            </div>
            {/* Map Component */}
            <div className="flex-1 relative">
              <MapComponent />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-background shrink-0">
            <DataSourceSidebar />
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
