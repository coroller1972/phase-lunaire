import { Component, Suspense, lazy, startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  CalendarBlank,
  CaretDown,
  Info,
  MapPin,
  Mouse,
  ArrowsOut,
  SunHorizon,
} from "@phosphor-icons/react";
import tzLookup from "tz-lookup";
import { addObservationHours, calculateLunarSnapshot, createLunarTimeline } from "./lib/astronomy";
import { photonGeocoder } from "./lib/geocoding";
import {
  formatEventTime,
  formatObservationDate,
  formatObservationTime,
  isValidLocalDateTime,
  localDateTimeToUtc,
  utcToLocalDateTime,
} from "./lib/time";
import { DateTimePicker } from "./components/DateTimePicker";
import { LessonStepper } from "./components/LessonStepper";
import { LocationPicker } from "./components/LocationPicker";
import { LunarTimeline } from "./components/LunarTimeline";
import { MoonLens } from "./components/MoonLens";
import type { LessonStep, ObservationInput, PlaceResult } from "./types";

const SpaceScene = lazy(() => import("./components/SpaceScene"));

const PARIS = { label: "Paris, France", latitude: 48.8566, longitude: 2.3522, timezone: "Europe/Paris" };
const LESSON_COPY: Record<LessonStep, string> = {
  1: "Choisissez un lieu : votre position change l’orientation de la Lune et sa hauteur dans le ciel, mais presque pas sa phase.",
  2: "Le Soleil éclaire toujours une moitié de la Lune. En tournant autour de la Terre, elle nous présente une part différente de cette moitié éclairée.",
  3: "La loupe montre la partie éclairée depuis votre lieu, orientée par rapport à l’horizon. Parcourez le mois pour voir la phase évoluer.",
};
function initialObservation(): ObservationInput {
  const isQa = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("qa");
  const instant = isQa ? new Date("2026-08-18T19:00:00.000Z") : new Date();
  return {
    ...PARIS,
    elevationM: 35,
    localDateTime: utcToLocalDateTime(instant, PARIS.timezone),
  };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("La scène 3D n’a pas pu démarrer", error, info); }
  render() {
    if (this.state.failed) {
      return (
        <div className="scene-fallback" role="status">
          <Info size={30} weight="light" />
          <strong>La vue 3D n’est pas disponible.</strong>
          <span>Les calculs et les contrôles restent utilisables.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [step, setStep] = useState<LessonStep>(() => new URLSearchParams(window.location.search).has("qa") ? 3 : 1);
  const [observation, setObservation] = useState<ObservationInput>(initialObservation);
  const [activePopover, setActivePopover] = useState<"location" | "datetime" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recenterToken, setRecenterToken] = useState(0);
  const reverseController = useRef<AbortController | null>(null);
  const popoverTrigger = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const snapshot = useMemo(() => calculateLunarSnapshot(observation), [observation]);
  const timeline = useMemo(() => createLunarTimeline(observation), [observation]);

  useEffect(() => () => reverseController.current?.abort(), []);

  function closePopover() {
    setActivePopover(null);
    popoverTrigger.current?.focus();
  }

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setObservation((current) => addObservationHours(current, 3));
    }, reducedMotion ? 1200 : 400);
    return () => window.clearInterval(timer);
  }, [isPlaying, reducedMotion]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setIsPlaying(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePopover(null);
        popoverTrigger.current?.focus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function updatePlace(place: PlaceResult) {
    reverseController.current?.abort();
    setIsPlaying(false);
    setObservation((current) => {
      const instant = localDateTimeToUtc(current.localDateTime, current.timezone);
      let timezone = current.timezone;
      try { timezone = tzLookup(place.latitude, place.longitude); } catch { /* Keep the known zone. */ }
      return {
        ...current,
        label: place.label,
        latitude: place.latitude,
        longitude: place.longitude,
        elevationM: 0,
        timezone,
        localDateTime: utcToLocalDateTime(instant, timezone),
      };
    });
    closePopover();
  }

  async function handleCoordinatePick(latitude: number, longitude: number) {
    updatePlace({
      id: `${latitude}-${longitude}`,
      label: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
      latitude,
      longitude,
    });
    const controller = new AbortController();
    reverseController.current = controller;
    try {
      const place = await photonGeocoder.reverse(latitude, longitude, controller.signal);
      if (place && !controller.signal.aborted) startTransition(() => setObservation((current) =>
        current.latitude === latitude && current.longitude === longitude ? { ...current, label: place.label } : current));
    } catch (error) {
      if ((error as Error).name !== "AbortError") console.info("Le libellé du lieu restera sous forme de coordonnées.");
    }
  }

  const illuminatedPercent = Math.round(snapshot.illuminatedFraction * 100);
  const skyStatus = snapshot.moonAboveHorizon
    ? `Au-dessus de l’horizon à ${Math.round(snapshot.altitudeDeg)}°, azimut ${Math.round(snapshot.azimuthDeg)}°.`
    : `Sous l’horizon à ${Math.round(snapshot.altitudeDeg)}°. ${snapshot.nextRiseUtc ? `Prochain lever le ${formatObservationDate(utcToLocalDateTime(snapshot.nextRiseUtc, observation.timezone), observation.timezone)} à ${formatEventTime(snapshot.nextRiseUtc, observation.timezone)}.` : "Aucun lever dans les trois prochains jours."}`;

  function togglePopover(value: "location" | "datetime") {
    setIsPlaying(false);
    popoverTrigger.current = document.activeElement as HTMLElement | null;
    setActivePopover((current) => current === value ? null : value);
  }

  return (
    <main className="app-shell">
      <section className="space-stage" aria-label="Visualisation interactive Terre, Lune et Soleil">
        <header className="brand-block">
          <h1>VOIR <span>LA LUNE</span></h1>
          <p>Comprendre les phases, depuis votre ciel.</p>
        </header>

        <LessonStepper step={step} onChange={setStep} />
        <p className="lesson-copy" aria-live="polite">{LESSON_COPY[step]}</p>

        <div className="scene-layer">
          <SceneErrorBoundary>
            <Suspense fallback={<div className="scene-loading">Préparation du ciel…</div>}>
              <SpaceScene
                step={step}
                observation={observation}
                snapshot={snapshot}
                reducedMotion={reducedMotion}
                recenterToken={recenterToken}
                onPickCoordinates={handleCoordinatePick}
              />
            </Suspense>
          </SceneErrorBoundary>
        </div>

        <aside className="phase-panel is-visible" aria-label="Phase observée">
          <p className="lens-caption">Depuis votre horizon</p>
          <div className="phase-dial">
            <MoonLens illuminatedFraction={snapshot.illuminatedFraction} brightLimbAngleDeg={snapshot.brightLimbAngleDeg} northAngleDeg={snapshot.northAngleDeg} />
            <div className="dial-ticks" aria-hidden="true" />
            <div className="illumination-arc" style={{ "--arc-angle": `${illuminatedPercent * 1.2 - 45}deg` } as React.CSSProperties} aria-hidden="true" />
          </div>
          <h2>{snapshot.phaseName}</h2>
          <p className="illumination-value">{illuminatedPercent} % éclairée</p>
          <p className={`visibility-copy${snapshot.moonAboveHorizon ? " is-visible" : ""}`}>
            <SunHorizon size={17} weight="light" aria-hidden="true" /> {skyStatus}
          </p>
          <div className="observation-controls">
            <button type="button" onClick={() => togglePopover("location")} aria-expanded={activePopover === "location"}>
              <MapPin size={22} weight="light" />
              <span>{observation.label}</span>
              <CaretDown size={15} weight="light" />
            </button>
            <span className="control-divider" aria-hidden="true" />
            <button type="button" onClick={() => togglePopover("datetime")} aria-expanded={activePopover === "datetime"}>
              <CalendarBlank size={22} weight="light" />
              <span>{formatObservationDate(observation.localDateTime, observation.timezone)}<small>{formatObservationTime(observation.localDateTime, observation.timezone)} · {observation.timezone.replaceAll("_", " ")}</small></span>
              <CaretDown size={15} weight="light" />
            </button>
          </div>
          <details className="model-note"><summary>À propos de cette vue</summary><p>L’éclairage et son orientation sont calculés pour votre lieu. Le relief est simplifié ; les librations et éclipses ne sont pas représentées. Être au-dessus de l’horizon ne garantit pas une observation à l’œil nu.</p></details>
        </aside>

        <LocationPicker
          open={activePopover === "location"}
          observation={observation}
          onClose={closePopover}
          onSelect={updatePlace}
          onManualSelect={handleCoordinatePick}
        />
        <DateTimePicker
          open={activePopover === "datetime"}
          observation={observation}
          onClose={closePopover}
          onChange={(localDateTime) => {
            if (isValidLocalDateTime(localDateTime, observation.timezone)) setObservation((current) => ({ ...current, localDateTime }));
          }}
        />

        <div className="scene-hints" aria-hidden="true">
          <span><Mouse size={18} weight="light" /> Faites glisser pour orbiter</span>
          <span>Molette pour zoomer</span>
          <span>Cliquez sur la Terre pour placer l’observateur</span>
        </div>
        <div className="scale-note">Représentation non à l’échelle</div>
        <button className="recenter-action" type="button" onClick={() => setRecenterToken((value) => value + 1)}><ArrowsOut size={17} /> Recentrer la vue</button>
      </section>

      <LunarTimeline
        observation={observation}
        points={timeline}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((value) => !value)}
        onSelect={(localDateTime) => { setIsPlaying(false); setObservation((current) => ({ ...current, localDateTime })); }}
        onStep={(hours) => { setIsPlaying(false); setObservation((current) => addObservationHours(current, hours)); }}
      />

      <footer className="source-credit">Textures NASA Earth Observatory &amp; NASA SVS · Calculs Astronomy Engine</footer>
      <p className="sr-only" aria-live={isPlaying ? "off" : "polite"}>
        {snapshot.phaseName}, {illuminatedPercent} pour cent éclairée. {skyStatus}
      </p>
    </main>
  );
}
