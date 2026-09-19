import { ArrowLeft, ArrowRight, Pause, Play } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { formatShortDate, localDateTimeToUtc } from "../lib/time";
import { MoonLens } from "./MoonLens";
import type { ObservationInput, TimelinePoint } from "../types";

interface LunarTimelineProps {
  observation: ObservationInput;
  points: TimelinePoint[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelect: (localDateTime: string) => void;
  onStep: (hours: number) => void;
}

export function LunarTimeline({ observation, points, isPlaying, onTogglePlay, onSelect, onStep }: LunarTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const observationInstant = localDateTimeToUtc(observation.localDateTime, observation.timezone);
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const distance = Math.abs(point.date.getTime() - observationInstant.getTime());
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  useEffect(() => {
    const track = trackRef.current;
    const current = track?.children[nearestIndex] as HTMLElement | undefined;
    if (!track || !current) return;
    track.scrollLeft = current.offsetLeft - track.clientWidth / 2 + current.offsetWidth / 2;
  }, [nearestIndex]);

  return (
    <section className="lunar-timeline" aria-labelledby="timeline-title">
      <div className="transport-controls">
        <button type="button" className="round-action" onClick={() => onStep(-24)} aria-label="Jour précédent"><ArrowLeft size={28} weight="light" /></button>
        <button type="button" className="round-action round-action--primary" onClick={onTogglePlay} aria-label={isPlaying ? "Mettre l’animation en pause" : "Lire l’animation"}>
          {isPlaying ? <Pause size={31} weight="fill" /> : <Play size={31} weight="fill" />}
        </button>
        <button type="button" className="round-action" onClick={() => onStep(24)} aria-label="Jour suivant"><ArrowRight size={28} weight="light" /></button>
      </div>
      <div className="timeline-content">
        <h2 id="timeline-title">Explorer le mois lunaire</h2>
        <div className="timeline-track" ref={trackRef}>
          {points.map((point, index) => (
            <button
              key={point.date.toISOString()}
              type="button"
              className={`phase-point${index === nearestIndex ? " is-current" : ""}`}
              onClick={() => onSelect(point.localDateTime)}
              aria-current={index === nearestIndex ? "date" : undefined}
              aria-label={`${formatShortDate(point.date, observation.timezone)}, ${Math.round(point.illuminatedFraction * 100)} % éclairée`}
            >
              <span className="phase-image-wrap">
                <MoonLens illuminatedFraction={point.illuminatedFraction} brightLimbAngleDeg={point.phaseAngleDeg < 180 ? 90 : -90} size={64} />
              </span>
              <span className="phase-date">{formatShortDate(point.date, observation.timezone)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
