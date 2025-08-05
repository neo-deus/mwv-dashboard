"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PolygonNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  defaultName: string;
  vertexCount: number;
}

export function PolygonNameModal({
  isOpen,
  onClose,
  onConfirm,
  defaultName,
  vertexCount,
}: PolygonNameModalProps) {
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
      setName(""); // Reset for next time
    }
  };

  const handleCancel = () => {
    onClose();
    setName(""); // Reset for next time
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />

      {/* Modal */}
      <Card className="relative z-[10002] w-full max-w-md mx-4 p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Name Your Polygon
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ve created a polygon with {vertexCount} vertices. Please
              give it a name.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="polygon-name"
                className="text-sm font-medium text-foreground block mb-2"
              >
                Polygon Name
              </label>
              <input
                id="polygon-name"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter polygon name..."
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                Create Polygon
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
