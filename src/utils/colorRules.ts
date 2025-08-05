import type { DataSource, ColorRule } from "@/types";


export function applyRules(value: number, rules: ColorRule[]): string {
  const sortedRules = [...rules].sort((a, b) => b.value - a.value);

  for (const rule of sortedRules) {
    if (evaluateRule(value, rule)) {
      return rule.color;
    }
  }

  return "#9ca3af";
}


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


export function getTemperatureColor(
  temperature: number,
  dataSource: DataSource
): string {
  return applyRules(temperature, dataSource.rules);
}


export function formatTemperature(temperature: number): string {
  return `${temperature.toFixed(1)}°C`;
}


export function getTemperatureLabel(temperature: number): string {
  if (temperature < 0) return "Freezing";
  if (temperature < 10) return "Cold";
  if (temperature < 20) return "Cool";
  if (temperature < 25) return "Moderate";
  if (temperature < 30) return "Warm";
  return "Hot";
}
