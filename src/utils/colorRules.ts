/**
 * Utilities for applying data source rules to determine polygon colors
 */

import type { DataSource, ColorRule } from "@/types";

/**
 * Apply rules to a value and return the appropriate color
 * @param value The value to evaluate
 * @param rules Array of rules to apply
 * @returns The color string for the matching rule, or a default color
 */
export function applyRules(value: number, rules: ColorRule[]): string {
  // Sort rules by value in descending order to handle >= operators correctly
  const sortedRules = [...rules].sort((a, b) => b.value - a.value);

  for (const rule of sortedRules) {
    if (evaluateRule(value, rule)) {
      return rule.color;
    }
  }

  // Default color if no rules match
  return "#9ca3af"; // Gray color as fallback
}

/**
 * Evaluate if a value matches a rule
 * @param value The value to test
 * @param rule The rule to evaluate
 * @returns true if the rule matches
 */
function evaluateRule(value: number, rule: ColorRule): boolean {
  switch (rule.operator) {
    case "<":
      return value < rule.value;
    case "<=":
      return value <= rule.value;
    case ">":
      return value > rule.value;
    case ">=":
      return value >= rule.value;
    case "=":
    case "==":
      return value === rule.value;
    case "!=":
      return value !== rule.value;
    default:
      console.warn(`Unknown operator: ${rule.operator}`);
      return false;
  }
}

/**
 * Get the color for a temperature value using the temperature data source rules
 * @param temperature Temperature in Celsius
 * @param dataSource The temperature data source with rules
 * @returns Color string
 */
export function getTemperatureColor(
  temperature: number,
  dataSource: DataSource
): string {
  return applyRules(temperature, dataSource.rules);
}

/**
 * Format temperature value for display
 * @param temperature Temperature in Celsius
 * @returns Formatted temperature string
 */
export function formatTemperature(temperature: number): string {
  return `${temperature.toFixed(1)}°C`;
}

/**
 * Get a descriptive label for temperature ranges
 * @param temperature Temperature in Celsius
 * @returns Descriptive label
 */
export function getTemperatureLabel(temperature: number): string {
  if (temperature < 0) return "Freezing";
  if (temperature < 10) return "Cold";
  if (temperature < 20) return "Cool";
  if (temperature < 25) return "Moderate";
  if (temperature < 30) return "Warm";
  return "Hot";
}
