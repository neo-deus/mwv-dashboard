"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useDashboardStore } from "@/stores/dashboardStore";
import { ColorRuleEditor } from "./ColorRuleEditor";
import { PolygonList } from "./PolygonList";
import { Palette, Layers, Target } from "lucide-react";

export function DataSourceSidebar() {
  const { dataSources, polygons, selectedPolygon } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<"polygons" | "rules" | "sources">(
    "polygons"
  );

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
              {dataSources.map((dataSource) => (
                <div key={dataSource.id} className="mb-6">
                  <h4 className="font-medium text-sm mb-2">
                    {dataSource.name}
                  </h4>
                  <ColorRuleEditor dataSourceId={dataSource.id} />
                </div>
              ))}
            </Card>
          </div>
        )}

        {activeTab === "sources" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">Data Sources</h3>
              {dataSources.map((source) => (
                <div key={source.id} className="p-3 border rounded-lg mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{source.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {source.field}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {source.rules.length} color rules defined
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                disabled
              >
                Add Data Source (Bonus Feature)
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/50">
        <div className="text-xs text-muted-foreground text-center">
          MWV Weather Dashboard v1.0
        </div>
      </div>
    </div>
  );
}
