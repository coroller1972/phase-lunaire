import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  SiderealTime,
  Observer,
  SearchMoonPhase,
  SearchRiseSet,
  GeoVector,
  RotateVector,
  Rotation_EQJ_EQD,
  EquatorFromVector,
} from "astronomy-engine";
import type { LunarSnapshot, ObservationInput, TimelinePoint } from "../types";
import { localDateTimeToUtc, utcToLocalDateTime } from "./time";
import { getDiskOrientation } from "./lunar-disk";

export function getPhaseName(phaseAngleDeg: number): string {
  const angle = ((phaseAngleDeg % 360) + 360) % 360;
  if (angle < 5 || angle >= 355) return "Nouvelle Lune";
  if (angle < 85) return "Premier croissant";
  if (angle <= 95) return "Premier quartier";
  if (angle < 175) return "Lune gibbeuse croissante";
  if (angle <= 185) return "Pleine Lune";
  if (angle < 265) return "Lune gibbeuse décroissante";
  if (angle <= 275) return "Dernier quartier";
  return "Dernier croissant";
}

export function calculateLunarSnapshot(observation: ObservationInput): LunarSnapshot {
  const instantUtc = localDateTimeToUtc(observation.localDateTime, observation.timezone);
  const observer = new Observer(observation.latitude, observation.longitude, observation.elevationM);
  const moonEquator = Equator(Body.Moon, instantUtc, observer, true, true);
  const sunEquator = Equator(Body.Sun, instantUtc, observer, true, true);
  const geocentricSunEquator = EquatorFromVector(RotateVector(Rotation_EQJ_EQD(instantUtc), GeoVector(Body.Sun, instantUtc, true)));
  const moonHorizon = Horizon(instantUtc, observer, moonEquator.ra, moonEquator.dec, "normal");
  const sunHorizon = Horizon(instantUtc, observer, sunEquator.ra, sunEquator.dec, "normal");
  const moonGeometric = Horizon(instantUtc, observer, moonEquator.ra, moonEquator.dec);
  const sunGeometric = Horizon(instantUtc, observer, sunEquator.ra, sunEquator.dec);
  const illumination = Illumination(Body.Moon, instantUtc);
  const phaseAngleDeg = MoonPhase(instantUtc);
  const nextRise = SearchRiseSet(Body.Moon, observer, 1, instantUtc, 3);
  const nextSet = SearchRiseSet(Body.Moon, observer, -1, instantUtc, 3);
  const sunLongitudeDeg = ((geocentricSunEquator.ra - SiderealTime(instantUtc)) * 15 + 540) % 360 - 180;

  return {
    instantUtc,
    phaseName: getPhaseName(phaseAngleDeg),
    phaseAngleDeg,
    illuminatedFraction: illumination.phase_fraction,
    ...getDiskOrientation(observation.latitude, moonGeometric.altitude, moonGeometric.azimuth, sunGeometric.altitude, sunGeometric.azimuth),
    waxing: phaseAngleDeg < 180,
    altitudeDeg: moonHorizon.altitude,
    azimuthDeg: moonHorizon.azimuth,
    moonAboveHorizon: moonHorizon.altitude > 0,
    sunAltitudeDeg: sunHorizon.altitude,
    sunLatitudeDeg: geocentricSunEquator.dec,
    sunLongitudeDeg,
    nextRiseUtc: nextRise?.date ?? null,
    nextSetUtc: nextSet?.date ?? null,
  };
}

export function createLunarTimeline(observation: ObservationInput, count = 9): TimelinePoint[] {
  if (!Number.isInteger(count) || count < 2) throw new RangeError("Au moins deux repères sont nécessaires.");
  const instant = localDateTimeToUtc(observation.localDateTime, observation.timezone);
  const newMoon = SearchMoonPhase(0, instant, -35);
  if (!newMoon) throw new Error("Lunaison introuvable.");
  const start = newMoon.date;

  return Array.from({ length: count }, (_, index) => {
    const event = index === 0 ? newMoon : SearchMoonPhase((index * 360 / (count - 1)) % 360, new Date(start.getTime() + 3600000), 35);
    if (!event) throw new Error("Phase introuvable.");
    // The controls use minute precision. Select the minute AFTER the event so a
    // new-moon click cannot land just before it and reopen the preceding lunation.
    const date = new Date(Math.ceil(event.date.getTime() / 60000) * 60000);
    const illumination = Illumination(Body.Moon, date);
    return {
      date,
      localDateTime: utcToLocalDateTime(date, observation.timezone),
      phaseAngleDeg: MoonPhase(date),
      illuminatedFraction: illumination.phase_fraction,
    };
  });
}

export function addObservationHours(observation: ObservationInput, hours: number): ObservationInput {
  const instant = localDateTimeToUtc(observation.localDateTime, observation.timezone);
  const next = new Date(instant.getTime() + hours * 3600000);
  return { ...observation, localDateTime: utcToLocalDateTime(next, observation.timezone) };
}
