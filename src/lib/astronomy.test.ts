import { describe, expect, it } from "vitest";
import { addObservationHours, calculateLunarSnapshot, createLunarTimeline, getPhaseName } from "./astronomy";
import type { ObservationInput } from "../types";

const fixture: ObservationInput = {
  label: "Paris, France",
  latitude: 48.8566,
  longitude: 2.3522,
  elevationM: 35,
  timezone: "Europe/Paris",
  localDateTime: "2026-08-18T21:00",
};

describe("phase lunaire", () => {
  it.each([
    [0, "Nouvelle Lune"],
    [45, "Premier croissant"],
    [90, "Premier quartier"],
    [135, "Lune gibbeuse croissante"],
    [180, "Pleine Lune"],
    [225, "Lune gibbeuse décroissante"],
    [270, "Dernier quartier"],
    [315, "Dernier croissant"],
  ])("nomme l’angle %i°", (angle, expected) => {
    expect(getPhaseName(angle)).toBe(expected);
  });

  it("calcule la fixture de référence avec des valeurs physiques bornées", () => {
    const snapshot = calculateLunarSnapshot(fixture);
    expect(snapshot.instantUtc.toISOString()).toBe("2026-08-18T19:00:00.000Z");
    expect(snapshot.phaseName).toBe("Premier croissant");
    expect(snapshot.illuminatedFraction).toBeGreaterThan(0);
    expect(snapshot.illuminatedFraction).toBeLessThan(0.5);
    expect(snapshot.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(snapshot.azimuthDeg).toBeLessThan(360);
    expect(snapshot.sunAltitudeDeg).toBeLessThan(0);
    expect(snapshot.sunLatitudeDeg).toBeCloseTo(12.9, 0);
    expect(snapshot.sunLongitudeDeg).toBeCloseTo(-104, 0);
  });

  it("produit neuf phases réelles entre deux nouvelles Lunes", () => {
    const points = createLunarTimeline(fixture);
    expect(points).toHaveLength(9);
    const spanDays = (points.at(-1)!.date.getTime() - points[0].date.getTime()) / 86_400_000;
    expect(spanDays).toBeGreaterThan(29);
    expect(spanDays).toBeLessThan(30);
    expect(points[0].illuminatedFraction).toBeLessThan(0.01);
    expect(points[2].illuminatedFraction).toBeCloseTo(0.5, 2);
    expect(points[4].illuminatedFraction).toBeGreaterThan(0.99);
    expect(points[8].illuminatedFraction).toBeLessThan(0.01);
  });

  it.each(["Europe/Paris", "Australia/Sydney", "America/New_York"])("conserve la lunaison après sélection du premier repère dans %s", (timezone) => {
    const input = { ...fixture, timezone, localDateTime: "2026-09-19T14:52" };
    const points = createLunarTimeline(input);
    const afterClick = createLunarTimeline({ ...input, localDateTime: points[0].localDateTime });
    expect(afterClick[0].date.toISOString()).toBe(points[0].date.toISOString());
    expect(afterClick.map((point) => point.localDateTime)).toEqual(points.map((point) => point.localDateTime));
  });

  it("retrouve le début même pour une lunaison plus longue que la moyenne", () => {
    const points = createLunarTimeline({ ...fixture, localDateTime: "2026-09-11T05:00" });
    expect(points[0].date.toISOString().slice(0, 10)).toBe("2026-08-12");
  });

  it("préserve la phase mais adapte l’orientation au lieu à un même instant", () => {
    const paris = calculateLunarSnapshot(fixture);
    const sydney = calculateLunarSnapshot({ ...fixture, latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney", localDateTime: "2026-08-19T05:00" });
    expect(sydney.illuminatedFraction).toBeCloseTo(paris.illuminatedFraction, 10);
    expect(Math.abs(sydney.brightLimbAngleDeg - paris.brightLimbAngleDeg)).toBeGreaterThan(20);
  });

  it("déplace l’observation sans dérive de fuseau", () => {
    expect(addObservationHours(fixture, 6).localDateTime).toBe("2026-08-19T03:00");
  });
});
