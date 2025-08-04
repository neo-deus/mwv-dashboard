"use client";

import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Home, Square } from "lucide-react";

export default function MapControls() {
  const map = useMap();
  const { isDrawing, setIsDrawing } = useDashboardStore();

  const handleCenterReset = () => {
    const defaultCenter: [number, number] = [52.52, 13.41]; // Berlin
    const defaultZoom = 10;
    map.setView(defaultCenter, defaultZoom);
  };

  const handleDrawToggle = () => {
    setIsDrawing(!isDrawing);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleCenterReset}
        className="shadow-lg"
        title="Reset map center"
      >
        <Home className="h-4 w-4" />
      </Button>
    </div>
  );
}
