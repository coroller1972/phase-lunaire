import type { GeocodingProvider, PlaceResult } from "../types";

const PHOTON_URL = "https://photon.komoot.io";
const sessionCache = new Map<string, PlaceResult[]>();

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
}

function toPlace(feature: PhotonFeature, index: number, preferCity = false): PlaceResult {
  const [longitude, latitude] = feature.geometry.coordinates;
  const name = (preferCity ? feature.properties.city : undefined) ?? feature.properties.name ?? feature.properties.city ?? "Lieu sélectionné";
  const area = feature.properties.state ?? feature.properties.country;
  return {
    id: String(feature.properties.osm_id ?? `${latitude}-${longitude}-${index}`),
    label: area && area !== name ? `${name}, ${area}` : name,
    latitude,
    longitude,
    country: feature.properties.countrycode?.toUpperCase(),
  };
}

async function readPhoton(url: URL, signal?: AbortSignal, preferCity = false): Promise<PlaceResult[]> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Photon a répondu ${response.status}`);
  const payload = (await response.json()) as { features?: PhotonFeature[] };
  return (payload.features ?? []).slice(0, 6).map((feature, index) => toPlace(feature, index, preferCity));
}

export const photonGeocoder: GeocodingProvider = {
  async search(query, signal) {
    const normalized = query.trim().toLocaleLowerCase("fr-FR");
    if (normalized.length < 3) return [];
    const cached = sessionCache.get(normalized);
    if (cached) return cached;

    const url = new URL("/api", PHOTON_URL);
    url.searchParams.set("q", query.trim());
    url.searchParams.set("lang", "fr");
    url.searchParams.set("limit", "6");
    url.searchParams.append("layer", "city");
    url.searchParams.append("layer", "locality");
    const places = await readPhoton(url, signal);
    sessionCache.set(normalized, places);
    return places;
  },

  async reverse(latitude, longitude, signal) {
    const url = new URL("/reverse", PHOTON_URL);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("lang", "fr");
    url.searchParams.set("limit", "1");
    const [place] = await readPhoton(url, signal, true);
    return place ?? null;
  },
};
