import { useDeferredValue, useEffect, useState } from "react";
import { Crosshair, MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";
import { photonGeocoder } from "../lib/geocoding";
import type { ObservationInput, PlaceResult } from "../types";

interface LocationPickerProps {
  open: boolean;
  observation: ObservationInput;
  onClose: () => void;
  onSelect: (place: PlaceResult) => void;
  onManualSelect: (latitude: number, longitude: number) => void;
}

export function LocationPicker({ open, observation, onClose, onSelect, onManualSelect }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [latitude, setLatitude] = useState(String(observation.latitude.toFixed(4)));
  const [longitude, setLongitude] = useState(String(observation.longitude.toFixed(4)));

  useEffect(() => {
    setLatitude(String(observation.latitude.toFixed(4)));
    setLongitude(String(observation.longitude.toFixed(4)));
  }, [observation.latitude, observation.longitude]);

  useEffect(() => {
    if (!open || deferredQuery.trim().length < 3) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    setResults([]);
    setStatus("loading");
    const timer = window.setTimeout(async () => {
      try {
        const places = await photonGeocoder.search(deferredQuery, controller.signal);
        if (!controller.signal.aborted) { setResults(places); setStatus("idle"); }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [deferredQuery, open]);

  if (!open) return null;

  const manualLatitude = Number(latitude.replace(",", "."));
  const manualLongitude = Number(longitude.replace(",", "."));
  const manualValid = latitude.trim() !== "" && longitude.trim() !== "" && Number.isFinite(manualLatitude) && Number.isFinite(manualLongitude) && manualLatitude >= -90 && manualLatitude <= 90 && manualLongitude >= -180 && manualLongitude <= 180;

  return (
    <div className="control-popover location-popover" role="dialog" aria-modal="false" aria-labelledby="location-title">
      <div className="popover-heading">
        <div>
          <span className="eyebrow">Point d’observation</span>
          <h2 id="location-title">Choisir un lieu</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
          <X size={20} weight="light" />
        </button>
      </div>

      <label className="search-field">
        <MagnifyingGlass size={20} weight="light" aria-hidden="true" />
        <span className="sr-only">Rechercher une ville</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une ville…" autoFocus />
      </label>

      <div className="place-results" aria-live="polite">
        {status === "loading" ? <p className="muted-copy">Recherche en cours…</p> : null}
        {status === "error" ? <p className="error-copy">La recherche est indisponible. Placez le point sur la Terre ou saisissez les coordonnées.</p> : null}
        {status === "idle" && deferredQuery.trim().length >= 3 && results.length === 0 ? <p className="muted-copy">Aucun résultat. Essayez une autre ville ou saisissez les coordonnées.</p> : null}
        {results.map((place) => (
          <button key={place.id} type="button" className="place-result" onClick={() => onSelect(place)}>
            <MapPin size={19} weight="light" />
            <span>
              <strong>{place.label}</strong>
              <small>{place.latitude.toFixed(3)}°, {place.longitude.toFixed(3)}°</small>
            </span>
          </button>
        ))}
      </div>

      <div className="manual-location">
        <div className="manual-location-title"><Crosshair size={18} weight="light" /> Coordonnées précises</div>
        <div className="coordinate-grid">
          <label>Latitude<input inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
          <label>Longitude<input inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
        </div>
        <button type="button" className="secondary-action" disabled={!manualValid} onClick={() => onManualSelect(manualLatitude, manualLongitude)}>Placer sur la Terre</button>
      </div>

      <p className="popover-footnote">Cliquez aussi sur la Terre pour placer le point. Recherche © OpenStreetMap, service Photon.</p>
    </div>
  );
}
