"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Moon, Sun, Menu } from "lucide-react";
import {
  formatDisplayDate,
  generateTimelineHours,
  sliderValueToDate,
  dateToSliderValue,
} from "@/utils/helpers";

// Return type for TimelineSlider component
interface TimelineSliderReturn {
  timelineComponent: React.ReactElement;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Custom Slider with Tooltip
function SliderWithTooltip({
  value,
  onValueChange,
  max,
  min,
  step,
  className,
  startDate,
}: {
  value: number[];
  onValueChange: (values: number[]) => void;
  max: number;
  min: number;
  step: number;
  className: string;
  startDate: Date;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState(0);
  const [tooltipValue, setTooltipValue] = useState(value[0]);

  // Update tooltip value when the slider value changes externally
  useEffect(() => {
    if (value.length > 1 && activeThumbIndex === 1) {
      setTooltipValue(value[1]);
    } else {
      setTooltipValue(value[0]);
    }
  }, [value, activeThumbIndex]);

  const handleValueChange = (values: number[]) => {
    // Determine which thumb is being moved
    const isStartChanged = values[0] !== value[0];
    const isEndChanged = values.length > 1 && values[1] !== value[1];

    if (isStartChanged) {
      setActiveThumbIndex(0);
      setTooltipValue(values[0]);
    } else if (isEndChanged) {
      setActiveThumbIndex(1);
      setTooltipValue(values[1]);
    } else {
      // If it's the first value change or single value mode
      setActiveThumbIndex(0);
      setTooltipValue(values[0]);
    }

    onValueChange(values);
  };

  const currentDate = sliderValueToDate(tooltipValue, startDate);
  const tooltipText = formatDisplayDate(currentDate);

  return (
    <div className="relative">
      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute -top-12 bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10 transform -translate-x-1/2 whitespace-nowrap"
          style={{
            left: `${(tooltipValue / max) * 100}%`,
          }}
        >
          {tooltipText}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-blue-600 dark:border-t-blue-500"></div>
        </div>
      )}

      <Slider
        value={value}
        onValueChange={handleValueChange}
        max={max}
        min={min}
        step={step}
        className={className}
        onPointerDown={(e) => {
          setShowTooltip(true);
          // Determine which thumb is being clicked based on mouse position
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const sliderWidth = rect.width;
          const clickPercentage = clickX / sliderWidth;
          const clickValue = clickPercentage * max;

          if (value.length > 1) {
            // For range mode, determine which thumb is closer to the click
            const distanceToStart = Math.abs(clickValue - value[0]);
            const distanceToEnd = Math.abs(clickValue - value[1]);

            if (distanceToStart <= distanceToEnd) {
              setActiveThumbIndex(0);
              setTooltipValue(value[0]);
            } else {
              setActiveThumbIndex(1);
              setTooltipValue(value[1]);
            }
          } else {
            setActiveThumbIndex(0);
            setTooltipValue(value[0]);
          }
        }}
        onPointerUp={() => setShowTooltip(false)}
        onMouseEnter={() => {
          // Set tooltip to the active thumb value when hovering
          if (value.length > 1 && activeThumbIndex === 1) {
            setTooltipValue(value[1]);
          } else {
            setTooltipValue(value[0]);
          }
          setShowTooltip(true);
        }}
        onMouseLeave={() => setShowTooltip(false)}
      />
    </div>
  );
}

export function TimelineSlider(): TimelineSliderReturn {
  const {
    timeline,
    setTimelineMode,
    setSelectedTime,
    setTimeRange,
    updatePolygonColorsForTime,
  } = useDashboardStore();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize dark mode from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
    return {
      timelineComponent: (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded"></div>
            <div className="h-4 bg-muted animate-pulse rounded"></div>
            <div className="h-6 bg-muted animate-pulse rounded"></div>
          </div>
        </Card>
      ),
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
    };
  }

  const { startDate, endDate, totalHours } = dateRange;

  // Convert current selected time to slider value
  const currentValue = dateToSliderValue(timeline.selectedTime, startDate);

  const handleSliderChange = (values: number[]) => {
    if (timeline.mode === "single") {
      const newDate = sliderValueToDate(values[0], startDate);
      setSelectedTime(newDate);

      // Update polygon colors based on the selected time
      console.log(
        `Timeline changed to: ${newDate.toISOString()}, updating polygon colors`
      );
      updatePolygonColorsForTime(newDate);
    } else {
      const startTime = sliderValueToDate(values[0], startDate);
      const endTime = sliderValueToDate(values[1], startDate);
      setTimeRange(startTime, endTime);
      setSelectedTime(startTime); // Set selected time to range start

      // Update polygon colors based on the range start time
      console.log(
        `Timeline range changed, updating polygon colors for: ${startTime.toISOString()}`
      );
      updatePolygonColorsForTime(startTime);
    }
  };

  return {
    timelineComponent: (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">MWV Dashboard</div>
            <div className="flex items-center gap-4">
              {/* Mobile Hamburger Menu */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">Menu</span>
              </Button>

              {/* Dark Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="flex items-center gap-2"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Timeline Mode Toggle */}
              <div className="hidden sm:flex items-center gap-2">
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
            </div>
          </div>

          {/* Mobile Timeline Mode Toggle */}
          <div className="sm:hidden flex items-center gap-2">
            <span className="text-sm font-medium">Timeline Mode:</span>
            <Button
              variant={timeline.mode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimelineMode("single")}
            >
              Single
            </Button>
            <Button
              variant={timeline.mode === "range" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimelineMode("range")}
            >
              Range
            </Button>
          </div>

          {/* Timeline Slider */}
          <div className="px-2 py-4">
            {timeline.mode === "single" ? (
              <SliderWithTooltip
                value={[currentValue]}
                onValueChange={handleSliderChange}
                max={totalHours}
                min={0}
                step={1}
                className="w-full"
                startDate={startDate}
              />
            ) : (
              <SliderWithTooltip
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
                startDate={startDate}
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
    ),
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  };
}
