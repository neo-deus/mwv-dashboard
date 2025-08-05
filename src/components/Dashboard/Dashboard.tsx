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
        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Map Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Timeline Slider with Mobile Navigation */}
            <div className="border-b bg-background p-3 shrink-0">
              <TimelineSliderWithMobile />
            </div>
            {/* Map Component */}
            <div className="flex-1 relative">
              <MapComponent />
            </div>
          </div>

          {/* Desktop Sidebar - hidden on mobile */}
          <div className="hidden lg:block w-80 border-l bg-background shrink-0">
            <DataSourceSidebar />
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}

function TimelineSliderWithMobile() {
  const { timelineComponent, isMobileSidebarOpen, setIsMobileSidebarOpen } =
    TimelineSlider();

  return (
    <>
      {timelineComponent}

      {/* Mobile Sidebar Modal */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Sidebar Modal */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l shadow-xl z-[10000]">
            <div className="h-full overflow-y-auto">
              <DataSourceSidebar
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
