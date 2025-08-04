"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboardStore";
import {
  formatDisplayDate,
  generateTimelineHours,
  sliderValueToDate,
  dateToSliderValue,
} from "@/utils/helpers";

export function TimelineSlider() {
  const { timeline, setTimelineMode, setSelectedTime, setTimeRange } =
    useDashboardStore();

  // Use state to avoid hydration issues with dates
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
    totalHours: number;
  } | null>(null);

  useEffect(() => {
    // Generate 30-day timeline (15 days before and after today) on client side only
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 15);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 15);
    endDate.setHours(23, 59, 59, 999);

    const totalHours = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    );

    setDateRange({ startDate, endDate, totalHours });
  }, []);

  // Don't render until we have the date range (client-side only)
  if (!dateRange) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-4 bg-muted animate-pulse rounded"></div>
          <div className="h-6 bg-muted animate-pulse rounded"></div>
        </div>
      </Card>
    );
  }

  const { startDate, endDate, totalHours } = dateRange;

  // Convert current selected time to slider value
  const currentValue = dateToSliderValue(timeline.selectedTime, startDate);

  const handleSliderChange = (values: number[]) => {
    if (timeline.mode === "single") {
      const newDate = sliderValueToDate(values[0], startDate);
      setSelectedTime(newDate);
    } else {
      const startTime = sliderValueToDate(values[0], startDate);
      const endTime = sliderValueToDate(values[1], startDate);
      setTimeRange(startTime, endTime);
      setSelectedTime(startTime); // Set selected time to range start
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Timeline Mode:</span>
          <Button
            variant={timeline.mode === "single" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimelineMode("single")}
          >
            Single Time
          </Button>
          <Button
            variant={timeline.mode === "range" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimelineMode("range")}
          >
            Time Range
          </Button>
        </div>

        {/* Current Selection Display */}
        <div className="text-sm text-muted-foreground">
          {timeline.mode === "single" ? (
            <span>Selected: {formatDisplayDate(timeline.selectedTime)}</span>
          ) : (
            <span>
              Range:{" "}
              {timeline.startTime
                ? formatDisplayDate(timeline.startTime)
                : "Not selected"}
              {" → "}
              {timeline.endTime
                ? formatDisplayDate(timeline.endTime)
                : "Not selected"}
            </span>
          )}
        </div>

        {/* Timeline Slider */}
        <div className="px-2">
          {timeline.mode === "single" ? (
            <Slider
              value={[currentValue]}
              onValueChange={handleSliderChange}
              max={totalHours}
              min={0}
              step={1}
              className="w-full"
            />
          ) : (
            <Slider
              value={[
                timeline.startTime
                  ? dateToSliderValue(timeline.startTime, startDate)
                  : 0,
                timeline.endTime
                  ? dateToSliderValue(timeline.endTime, startDate)
                  : totalHours,
              ]}
              onValueChange={handleSliderChange}
              max={totalHours}
              min={0}
              step={1}
              className="w-full"
            />
          )}
        </div>

        {/* Date Range Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatDisplayDate(startDate)}</span>
          <span>Today</span>
          <span>{formatDisplayDate(endDate)}</span>
        </div>
      </div>
    </Card>
  );
}
