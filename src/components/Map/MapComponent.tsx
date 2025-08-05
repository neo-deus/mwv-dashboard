"use client";

import dynamic from "next/dynamic";

const DynamicMapComponentInner = dynamic(() => import("./MapComponentInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

export const MapComponent = () => {
  return <DynamicMapComponentInner />;
};
