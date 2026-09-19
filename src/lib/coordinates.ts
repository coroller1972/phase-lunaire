import { MathUtils, Vector3 } from "three";

export function longitudeLatitudeToVector(latitude: number, longitude: number, radius: number): Vector3 {
  const lat = MathUtils.degToRad(latitude);
  const lon = MathUtils.degToRad(longitude);
  return new Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon),
  );
}

export function vectorToLongitudeLatitude(point: Vector3): { latitude: number; longitude: number } {
  const normalized = point.clone().normalize();
  return {
    latitude: MathUtils.radToDeg(Math.asin(normalized.y)),
    longitude: MathUtils.radToDeg(Math.atan2(-normalized.z, normalized.x)),
  };
}
