import type { LessonStep } from "../types";

const STEPS: Array<{ id: LessonStep; title: string }> = [
  { id: 1, title: "Votre point de vue" },
  { id: 2, title: "La lumière" },
  { id: 3, title: "La phase visible" },
];

export function LessonStepper({ step, onChange }: { step: LessonStep; onChange: (step: LessonStep) => void }) {
  return (
    <nav className="lesson-stepper" aria-label="Étapes de l’explication">
      <ol>
        {STEPS.map((item) => (
          <li key={item.id} className={item.id === step ? "is-active" : item.id < step ? "is-complete" : ""}>
            <button type="button" onClick={() => onChange(item.id)} aria-current={item.id === step ? "step" : undefined}>
              <span className="step-dot" aria-hidden="true" />
              <span className="step-number">0{item.id} —</span>
              <span className="step-title">{item.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
