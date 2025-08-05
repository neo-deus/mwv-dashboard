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
  "#3b82f6",
  "#22c55e", 
  "#ef4444",
  "#f97316", 
  "#8b5cf6", 
  "#06b6d4",
  "#84cc16",
  "#f59e0b", 
  "#ec4899",
  "#64748b",
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
        <div
          key={rule.id}
          className="flex items-center gap-2 p-2 border rounded-lg"
        >
          <div className="relative">
            <div
              className="w-8 h-8 rounded border cursor-pointer"
              style={{ backgroundColor: rule.color }}
              onClick={() =>
                setEditingRule(editingRule === rule.id ? null : rule.id)
              }
            />
            {editingRule === rule.id && (
              <div className="absolute top-10 left-0 z-10 bg-white border rounded-lg shadow-lg p-2">
                <div
                  className="flex gap-1 flex-wrap mb-2"
                  style={{ width: "120px" }}
                >
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        updateRule(rule.id, { color });
                        setEditingRule(null);
                      }}
                      className={`w-6 h-6 rounded border-2 ${
                        rule.color === color
                          ? "border-gray-800"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={rule.color}
                  onChange={(e) => {
                    updateRule(rule.id, { color: e.target.value });
                    setEditingRule(null);
                  }}
                  className="w-full h-6 border rounded"
                />
              </div>
            )}
          </div>

          <select
            value={rule.operator}
            onChange={(e) =>
              updateRule(rule.id, {
                operator: e.target.value as ColorRule["operator"],
              })
            }
            className="px-2 py-1 text-sm border rounded bg-background text-foreground dark:bg-background dark:text-foreground dark:border-border min-w-0 flex-shrink-0"
            style={{ width: "60px" }}
          >
            {OPERATORS.map((op) => (
              <option
                key={op.value}
                value={op.value}
                className="bg-background text-foreground"
              >
                {op.value}{" "}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={rule.value}
            onChange={(e) =>
              updateRule(rule.id, {
                value: parseFloat(e.target.value) || 0,
              })
            }
            className="px-2 py-1 text-sm border rounded bg-background text-foreground dark:bg-background dark:text-foreground dark:border-border min-w-0 flex-shrink-0"
            style={{ width: "60px" }}
            step="0.1"
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeRule(rule.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive flex-shrink-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addRule} className="w-full">
        <Plus className="h-3 w-3 mr-1" />
        Add Color Rule
      </Button>
    </div>
  );
}
