import type { LessonStep } from "../types";

/** Fit the complete educational scene, including the Sun, into the canvas. */
export function getSceneFraming(step: LessonStep, aspect: number) {
  const focusEarth = step === 1;
  const width = focusEarth ? 7 : 21.6;
  const height = focusEarth ? 7 : 12;
  const halfFov = 21 * Math.PI / 180;
  const distance = Math.max(height, width / Math.max(0.1, aspect)) / (2 * Math.tan(halfFov)) + 3.5;
  return { x: focusEarth ? -2.75 : 1.8, y: focusEarth ? 0.95 : 1.65, distance };
}
