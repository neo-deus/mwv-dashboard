"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export const GeomanControls = () => {
    const map = useMap();

    useEffect(() => {
        map.pm.addControls({
            position: "topleft",
            drawCircle: false,
            drawCircleMarker: false,
            drawMarker: false,
            drawPolyline: false,
            drawRectangle: false,
            drawText: false,
        });

        // Optional: Set global options for all layers
        map.pm.setGlobalOptions({
            snappable: true,
            snapDistance: 20,
        });

        return () => {
            map.pm.removeControls();
        };
    }, [map]);

    return null;
};
