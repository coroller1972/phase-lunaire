import { describe, expect, it } from "vitest";
import { getDiskOrientation, moonLightDirection } from "./lunar-disk";

describe("disque observé", () => {
  it.each([0, 0.05, 0.37, 0.5, 0.83, 1])("éclaire réellement la fraction %f du disque", (fraction) => {
    const light = moonLightDirection(fraction, 123);
    let disk = 0;
    let illuminated = 0;
    for (let row = 0; row < 400; row++) for (let col = 0; col < 400; col++) {
      const x = (col + 0.5) / 200 - 1;
      const y = (row + 0.5) / 200 - 1;
      if (x * x + y * y >= 1) continue;
      disk++;
      if (x * light.x + y * light.y + Math.sqrt(1 - x * x - y * y) * light.z > 0) illuminated++;
    }
    expect(Math.abs(illuminated / disk - fraction)).toBeLessThan(0.002);
  });

  it("oriente le côté éclairé vers le Soleil dans le ciel local", () => {
    expect(getDiskOrientation(45, 30, 180, 50, 180).brightLimbAngleDeg).toBeCloseTo(0, 8);
    expect(getDiskOrientation(45, 0, 180, 0, 270).brightLimbAngleDeg).toBeCloseTo(90, 8);
    expect(getDiskOrientation(45, 0, 180, 0, 90).brightLimbAngleDeg).toBeCloseTo(-90, 8);
  });

  it("inverse le nord céleste entre les pôles", () => {
    expect(getDiskOrientation(90, 45, 0, 30, 90).northAngleDeg).toBeCloseTo(0, 8);
    expect(Math.abs(getDiskOrientation(-90, 45, 0, 30, 90).northAngleDeg)).toBeCloseTo(180, 8);
  });
});
