/**
 * Utility functions for polygon operations
 */

/**
 * Calculate the centroid (geometric center) of a polygon
 * @param coordinates Array of [lat, lng] coordinates
 * @returns [lat, lng] of the centroid
 */
export function calculatePolygonCentroid(
  coordinates: [number, number][]
): [number, number] {
  if (coordinates.length === 0) {
    throw new Error("Cannot calculate centroid of empty polygon");
  }

  // Remove the last coordinate if it's a duplicate of the first (closed polygon)
  let coords = [...coordinates];
  if (
    coords.length > 1 &&
    coords[0][0] === coords[coords.length - 1][0] &&
    coords[0][1] === coords[coords.length - 1][1]
  ) {
    coords = coords.slice(0, -1);
  }

  // Calculate centroid using the shoelace formula
  let area = 0;
  let centroidLat = 0;
  let centroidLng = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[j];

    const crossProduct = lat1 * lng2 - lat2 * lng1;
    area += crossProduct;
    centroidLat += (lat1 + lat2) * crossProduct;
    centroidLng += (lng1 + lng2) * crossProduct;
  }

  area = area / 2;

  if (Math.abs(area) < 1e-10) {
    // Fallback to simple average for degenerate polygons
    const avgLat =
      coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
    const avgLng =
      coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
    return [avgLat, avgLng];
  }

  centroidLat = centroidLat / (6 * area);
  centroidLng = centroidLng / (6 * area);

  return [centroidLat, centroidLng];
}

/**
 * Calculate the bounding box center (alternative approach)
 * @param coordinates Array of [lat, lng] coordinates
 * @returns [lat, lng] of the bounding box center
 */
export function calculateBoundingBoxCenter(
  coordinates: [number, number][]
): [number, number] {
  if (coordinates.length === 0) {
    throw new Error("Cannot calculate center of empty polygon");
  }

  const lats = coordinates.map((coord) => coord[0]);
  const lngs = coordinates.map((coord) => coord[1]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}
