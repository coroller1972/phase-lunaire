const RAD = Math.PI / 180;

/** Clockwise angles on the observer's sky, measured from the local vertical. */
export function getDiskOrientation(latitude: number, moonAltitude: number, moonAzimuth: number, sunAltitude: number, sunAzimuth: number) {
  const h = moonAltitude * RAD;
  const a = moonAzimuth * RAD;
  const sh = sunAltitude * RAD;
  const sa = sunAzimuth * RAD;
  const lat = latitude * RAD;
  // Project the Sun onto the tangent plane at the Moon: right and up on the sky.
  const east = Math.cos(sh) * Math.sin(sa);
  const north = Math.cos(sh) * Math.cos(sa);
  const up = Math.sin(sh);
  return {
    brightLimbAngleDeg: Math.atan2(east * Math.cos(a) - north * Math.sin(a),
      -east * Math.sin(h) * Math.sin(a) - north * Math.sin(h) * Math.cos(a) + up * Math.cos(h)) / RAD,
    northAngleDeg: Math.atan2(-Math.cos(lat) * Math.sin(a),
      -Math.cos(lat) * Math.sin(h) * Math.cos(a) + Math.sin(lat) * Math.cos(h)) / RAD,
  };
}

/** The terminator encloses exactly the requested illuminated fraction of the disk. */
export function moonLightDirection(illuminatedFraction: number, brightLimbAngleDeg: number) {
  const z = 2 * Math.max(0, Math.min(1, illuminatedFraction)) - 1;
  const transverse = Math.sqrt(Math.max(0, 1 - z * z));
  const angle = brightLimbAngleDeg * RAD;
  return { x: transverse * Math.sin(angle), y: transverse * Math.cos(angle), z };
}
