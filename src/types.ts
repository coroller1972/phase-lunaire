export type LessonStep = 1 | 2 | 3;

export interface ObservationInput {
  label: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  timezone: string;
  localDateTime: string;
}

export interface LunarSnapshot {
  instantUtc: Date;
  phaseName: string;
  phaseAngleDeg: number;
  illuminatedFraction: number;
  brightLimbAngleDeg: number;
  northAngleDeg: number;
  waxing: boolean;
  altitudeDeg: number;
  azimuthDeg: number;
  moonAboveHorizon: boolean;
  sunAltitudeDeg: number;
  sunLatitudeDeg: number;
  sunLongitudeDeg: number;
  nextRiseUtc: Date | null;
  nextSetUtc: Date | null;
}

export interface PlaceResult {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  country?: string;
}

export interface GeocodingProvider {
  search(query: string, signal?: AbortSignal): Promise<PlaceResult[]>;
  reverse(latitude: number, longitude: number, signal?: AbortSignal): Promise<PlaceResult | null>;
}

export interface TimelinePoint {
  date: Date;
  localDateTime: string;
  phaseAngleDeg: number;
  illuminatedFraction: number;
}
