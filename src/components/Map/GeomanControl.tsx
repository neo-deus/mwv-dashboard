"use client";

import { createControlComponent } from "@react-leaflet/core";
import * as L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

interface Props extends L.ControlOptions {
  position: L.ControlPosition;
}

const Geoman = L.Control.extend({
  options: {} as Props,

  initialize(options: Props) {
    L.setOptions(this, options);
  },

  onAdd(map: L.Map) {
    console.log("GeomanControl onAdd called, map.pm available:", !!map.pm);

    if (!map.pm) {
      console.error("Geoman not available on map");
      return L.DomUtil.create("div"); // Return empty div if geoman not available
    }

    // Add only polygon drawing controls
    map.pm.addControls({
      position: this.options.position,
      drawPolygon: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
      oneBlock: true,
    });

    console.log("Geoman polygon-only controls added successfully");

    // Return a container div (required by Leaflet Control)
    const container = L.DomUtil.create("div", "leaflet-control-geoman");
    return container;
  },

  onRemove(map: L.Map) {
    // Cleanup when control is removed
    if (map.pm) {
      map.pm.removeControls();
    }
  },
});

const createGeomanInstance = (props: Props) => {
  return new Geoman(props);
};

export const GeomanControl = createControlComponent(createGeomanInstance);
