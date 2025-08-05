"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useDashboardStore } from "@/stores/dashboardStore";
import { ColorRuleEditor } from "./ColorRuleEditor";
import { PolygonList } from "./PolygonList";
import { Palette, Layers, Target, X } from "lucide-react";

interface DataSourceSidebarProps {
  onClose?: () => void;
}

export function DataSourceSidebar({ onClose }: DataSourceSidebarProps) {
  const {
    dataSources,
    polygons,
    selectedPolygon,
    activeDataSourceId,
    setActiveDataSource,
    updatePolygonColorsForTime,
    timeline,
  } = useDashboardStore();


  const [activeTab, setActiveTab] = useState<"polygons" | "rules" | "sources">(
    "polygons"
  );

  useEffect(() => {
    if (timeline.selectedTime) {
      updatePolygonColorsForTime(timeline.selectedTime);
    } else {
      updatePolygonColorsForTime(new Date());
    }
  }, [activeDataSourceId, timeline.selectedTime, updatePolygonColorsForTime]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dashboard Controls</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

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
                      ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20"
                      : "border-border hover:border-border/80 dark:border-border dark:hover:border-border/60"
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
                            : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="font-medium text-sm text-foreground">
                        {source.name}
                      </span>
                      {activeDataSourceId === source.id && (
                        <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {source.rules.length} color rules defined
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
