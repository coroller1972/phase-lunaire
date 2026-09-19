import { describe, expect, it } from "vitest";
import { longitudeLatitudeToVector, vectorToLongitudeLatitude } from "./coordinates";
import { Mesh, MeshBasicMaterial, Raycaster, SphereGeometry } from "three";

describe("coordonnées sphériques", () => {
  it.each([
    [0, 0],
    [48.8566, 2.3522],
    [-33.8688, 151.2093],
    [64.1466, -21.9426],
  ])("préserve latitude %f et longitude %f", (latitude, longitude) => {
    const result = vectorToLongitudeLatitude(longitudeLatitudeToVector(latitude, longitude, 2.55));
    expect(result.latitude).toBeCloseTo(latitude, 6);
    expect(result.longitude).toBeCloseTo(longitude, 6);
  });

  it.each([[48.8566, 2.3522], [-33.8688, 151.2093], [0, 0]])("place le repère sur la bonne longitude de la texture NASA : %f, %f", (latitude, longitude) => {
    const globe = new Mesh(new SphereGeometry(1, 128, 128), new MeshBasicMaterial());
    const point = longitudeLatitudeToVector(latitude, longitude, 1);
    const hit = new Raycaster(point.clone().multiplyScalar(2), point.clone().negate().normalize()).intersectObject(globe)[0];
    expect(hit.uv!.x * 360 - 180).toBeCloseTo(longitude, 1);
    expect(hit.uv!.y * 180 - 90).toBeCloseTo(latitude, 1);
    globe.geometry.dispose();
    globe.material.dispose();
  });
});
