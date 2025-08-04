import type { ColorRule } from "@/types";

/**
 * Apply color rules to determine polygon color based on data value
 */
export function applyColorRules(value: number, rules: ColorRule[]): string {
  // Sort rules by value to apply them in correct order
  const sortedRules = rules.sort((a, b) => a.value - b.value);

  for (const rule of sortedRules) {
    switch (rule.operator) {
      case "=":
        if (value === rule.value) return rule.color;
        break;
      case "<":
        if (value < rule.value) return rule.color;
        break;
      case ">":
        if (value > rule.value) return rule.color;
        break;
      case "<=":
        if (value <= rule.value) return rule.color;
        break;
      case ">=":
        if (value >= rule.value) return rule.color;
        break;
    }
  }

  // Default color if no rules match
  return "#9ca3af"; // gray-400
}

/**
 * Generate timeline hours for the date range
 */
export function generateTimelineHours(startDate: Date, endDate: Date): Date[] {
  const hours: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    hours.push(new Date(current));
    current.setHours(current.getHours() + 1);
  }

  return hours;
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: Date | string): string {
  // Convert string to Date if needed (for rehydrated data from localStorage)
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if it's a valid date
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate bounding box for polygon coordinates
 */
export function calculateBoundingBox(
  coordinates: [number, number][]
): [[number, number], [number, number]] {
  if (coordinates.length === 0) {
    return [
      [0, 0],
      [0, 0],
    ];
  }

  const lats = coordinates.map((coord) => coord[0]);
  const lngs = coordinates.map((coord) => coord[1]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/**
 * Validate polygon coordinates
 */
export function validatePolygon(coordinates: [number, number][]): {
  isValid: boolean;
  error?: string;
} {
  if (coordinates.length < 3) {
    return { isValid: false, error: "Polygon must have at least 3 points" };
  }

  if (coordinates.length > 12) {
    return { isValid: false, error: "Polygon cannot have more than 12 points" };
  }

  // Check if first and last points are the same (closed polygon)
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    return {
      isValid: false,
      error: "Polygon must be closed (first and last points should match)",
    };
  }

  return { isValid: true };
}

/**
 * Convert timeline slider value to date
 */
export function sliderValueToDate(value: number, startDate: Date): Date {
  const date = new Date(startDate);
  date.setHours(date.getHours() + value);
  return date;
}

/**
 * Convert date to timeline slider value
 */
export function dateToSliderValue(date: Date, startDate: Date): number {
  return Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60));
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
