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

    if (!map.pm) {
      console.error("Geoman not available on map");
      return L.DomUtil.create("div");
    }

    map.pm.addControls({
      position: this.options.position,
      drawPolygon: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
      oneBlock: true,
    });

    const container = L.DomUtil.create("div", "leaflet-control-geoman");
    return container;
  },

  onRemove(map: L.Map) {
    if (map.pm) {
      map.pm.removeControls();
    }
  },
});

const createGeomanInstance = (props: Props) => {
  return new Geoman(props);
};

export const GeomanControl = createControlComponent(createGeomanInstance);
