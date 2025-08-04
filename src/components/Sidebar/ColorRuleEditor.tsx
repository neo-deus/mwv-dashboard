"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Plus, Trash2, Palette } from "lucide-react";
import type { ColorRule } from "@/types";

interface ColorRuleEditorProps {
  dataSourceId: string;
}

const OPERATORS = [
  { value: "=", label: "Equals (=)" },
  { value: "<", label: "Less than (<)" },
  { value: ">", label: "Greater than (>)" },
  { value: "<=", label: "Less or equal (≤)" },
  { value: ">=", label: "Greater or equal (≥)" },
] as const;

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ef4444", // Red
  "#f97316", // Orange
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#64748b", // Gray
];

export function ColorRuleEditor({ dataSourceId }: ColorRuleEditorProps) {
  const { dataSources, updateDataSource } = useDashboardStore();
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const dataSource = dataSources.find((ds) => ds.id === dataSourceId);

  if (!dataSource) return null;

  const addRule = () => {
    const newRule: ColorRule = {
      id: crypto.randomUUID(),
      operator: ">=",
      value: 0,
      color: PRESET_COLORS[dataSource.rules.length % PRESET_COLORS.length],
    };

    updateDataSource(dataSourceId, {
      rules: [...dataSource.rules, newRule],
    });
  };

  const updateRule = (ruleId: string, updates: Partial<ColorRule>) => {
    const updatedRules = dataSource.rules.map((rule) =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );

    updateDataSource(dataSourceId, { rules: updatedRules });
  };

  const removeRule = (ruleId: string) => {
    const updatedRules = dataSource.rules.filter((rule) => rule.id !== ruleId);
    updateDataSource(dataSourceId, { rules: updatedRules });
  };

  return (
    <div className="space-y-3">
      {dataSource.rules.map((rule) => (
        <Card key={rule.id} className="p-3">
          <div className="space-y-3">
            {/* Rule Display */}
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border flex-shrink-0"
                style={{ backgroundColor: rule.color }}
              />
              <span className="text-sm font-mono">
                {dataSource.field} {rule.operator} {rule.value}
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setEditingRule(editingRule === rule.id ? null : rule.id)
                }
                className="h-6 w-6 p-0"
              >
                <Palette className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeRule(rule.id)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Rule Editor */}
            {editingRule === rule.id && (
              <div className="space-y-2 pt-2 border-t">
                {/* Operator */}
                <div>
                  <label className="text-xs font-medium">Operator</label>
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        operator: e.target.value as ColorRule["operator"],
                      })
                    }
                    className="w-full mt-1 px-2 py-1 text-xs border rounded"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="text-xs font-medium">Value</label>
                  <input
                    type="number"
                    value={rule.value}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 px-2 py-1 text-xs border rounded"
                    step="0.1"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-medium">Color</label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateRule(rule.id, { color })}
                        className={`w-6 h-6 rounded border-2 ${
                          rule.color === color
                            ? "border-foreground"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={rule.color}
                    onChange={(e) =>
                      updateRule(rule.id, { color: e.target.value })
                    }
                    className="w-full mt-2 h-8 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Add Rule Button */}
      <Button variant="outline" size="sm" onClick={addRule} className="w-full">
        <Plus className="h-3 w-3 mr-1" />
        Add Color Rule
      </Button>

      {/* Rule Summary */}
      {dataSource.rules.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">Rule Preview:</div>
          {dataSource.rules
            .sort((a, b) => a.value - b.value)
            .map((rule, idx) => (
              <div key={rule.id} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: rule.color }}
                />
                <span>
                  {rule.operator} {rule.value}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
