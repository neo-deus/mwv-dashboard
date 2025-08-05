"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { setSelectedTime, timeline } = useDashboardStore();

  useEffect(() => {
    if (!timeline.selectedTime) {
      setSelectedTime(new Date());
    }
  }, [setSelectedTime, timeline.selectedTime]);

  return <>{children}</>;
}
