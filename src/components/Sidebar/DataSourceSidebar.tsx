"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useDashboardStore } from "@/stores/dashboardStore";
import { ColorRuleEditor } from "./ColorRuleEditor";
import { PolygonList } from "./PolygonList";
import { Palette, Layers, Target } from "lucide-react";

export function DataSourceSidebar() {
  const {
    dataSources,
    polygons,
    selectedPolygon,
    activeDataSourceId,
    setActiveDataSource,
    updatePolygonColorsForTime,
    timeline,
  } = useDashboardStore();

  // Log current active data source for debugging
  // console.log(
  //   `🎯 DataSourceSidebar - Current active data source: ${activeDataSourceId}`
  // );

  const [activeTab, setActiveTab] = useState<"polygons" | "rules" | "sources">(
    "polygons"
  );

  // Refresh polygon colors when active data source changes
  useEffect(() => {
    // console.log(
    //   `🔄 Active data source changed, refreshing polygon colors for: ${activeDataSourceId}`
    // );

    // Update colors based on timeline and new data source
    if (timeline.selectedTime) {
      // console.log(
      //   `🎨 Updating polygon colors for timeline: ${timeline.selectedTime.toISOString()}`
      // );
      updatePolygonColorsForTime(timeline.selectedTime);
    } else {
      // console.log(`⏰ No timeline selected, using current time`);
      // If no timeline is selected, use current time
      updatePolygonColorsForTime(new Date());
    }
  }, [activeDataSourceId, timeline.selectedTime, updatePolygonColorsForTime]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Dashboard Controls</h2>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-3">
          <Button
            variant={activeTab === "polygons" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("polygons")}
            className="flex items-center gap-1"
          >
            <Target className="h-3 w-3" />
            Polygons ({polygons.length})
          </Button>
          <Button
            variant={activeTab === "rules" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("rules")}
            className="flex items-center gap-1"
          >
            <Palette className="h-3 w-3" />
            Rules
          </Button>
          <Button
            variant={activeTab === "sources" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sources")}
            className="flex items-center gap-1"
          >
            <Layers className="h-3 w-3" />
            Sources
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "polygons" && (
          <div className="space-y-4">
            <PolygonList />
          </div>
        )}

        {activeTab === "rules" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Color Rules</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define color rules for data visualization
              </p>
              {(() => {
                const activeDataSource = dataSources.find(
                  (ds) => ds.id === activeDataSourceId
                );
                if (!activeDataSource) {
                  return (
                    <div className="text-sm text-muted-foreground">
                      No active data source found
                    </div>
                  );
                }
                return (
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      {activeDataSource.name}
                    </h4>
                    <ColorRuleEditor dataSourceId={activeDataSource.id} />
                  </div>
                );
              })()}
            </Card>
          </div>
        )}

        {activeTab === "sources" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Data Sources</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select which weather parameter to visualize on all polygons:
              </p>
              {dataSources.map((source) => (
                <div
                  key={source.id}
                  className={`p-3 border rounded-lg mb-3 cursor-pointer transition-colors ${
                    activeDataSourceId === source.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    console.log(
                      `🖱️ Clicked on data source: ${source.id} (${source.name})`
                    );
                    console.log(
                      `📈 Current active data source before change: ${activeDataSourceId}`
                    );
                    setActiveDataSource(source.id);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          activeDataSourceId === source.id
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="font-medium text-sm">{source.name}</span>
                      {activeDataSourceId === source.id && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    {/* <span className="text-xs text-muted-foreground">
                      {source.field}
                    </span> */}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {source.rules.length} color rules defined
                  </div>
                </div>
              ))}

              

              {/* Debug/Migration Button */}
              {/* <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  localStorage.removeItem("mwv-dashboard-store");
                  window.location.reload();
                }}
              >
                🔄 Reset to Defaults (Debug)
              </Button> */}
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      {/* <div className="p-4 border-t bg-muted/50">
        <div className="text-xs text-muted-foreground text-center">
          MWV Weather Dashboard v1.0
        </div>
      </div> */}
    </div>
  );
}
