"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Trash2, MapPin, Eye } from "lucide-react";
import { formatDisplayDate } from "@/utils/helpers";

export function PolygonList() {
  const {
    polygons,
    removePolygon,
    selectedPolygon,
    setSelectedPolygon,
    dataSources,
  } = useDashboardStore();

  const getDataSourceName = (id: string) => {
    return dataSources.find((ds) => ds.id === id)?.name || "Unknown";
  };

  if (polygons.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MapPin className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-medium mb-2">No Polygons Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start by drawing polygons on the map to analyze weather data
        </p>
        <Button size="sm" variant="outline" disabled>
          <MapPin className="h-3 w-3 mr-1" />
          Use map drawing tool
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Polygons ({polygons.length})</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedPolygon(undefined)}
        >
          Clear Selection
        </Button>
      </div>

      {polygons.map((polygon) => (
        <Card
          key={polygon.id}
          className={`p-3 cursor-pointer transition-colors ${
            selectedPolygon === polygon.id
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:bg-muted/50"
          }`}
          onClick={() =>
            setSelectedPolygon(
              selectedPolygon === polygon.id ? undefined : polygon.id
            )
          }
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Polygon Name */}
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: polygon.color }}
                />
                <h4 className="font-medium text-sm truncate">{polygon.name}</h4>
              </div>

              {/* Details */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>Data: {getDataSourceName(polygon.dataSource)}</span>
                </div>
                <div>Points: {polygon.coordinates.length - 1}</div>
                <div>Created: {formatDisplayDate(polygon.createdAt)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  removePolygon(polygon.id);
                }}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Selected Polygon Details */}
          {selectedPolygon === polygon.id && (
            <div className="mt-3 pt-3 border-t text-xs">
              <div className="space-y-1">
                <div>
                  <span className="font-medium">Coordinates:</span>
                  <div className="mt-1 max-h-20 overflow-y-auto text-muted-foreground">
                    {polygon.coordinates.slice(0, -1).map((coord, idx) => (
                      <div key={idx}>
                        {idx + 1}: {coord[0].toFixed(4)}, {coord[1].toFixed(4)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
