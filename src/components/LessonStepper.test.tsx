import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LessonStepper } from "./LessonStepper";

describe("parcours pédagogique", () => {
  it("annonce l’étape active et permet de changer d’étape", () => {
    const onChange = vi.fn();
    render(<LessonStepper step={3} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /La phase visible/ })).toHaveAttribute("aria-current", "step");
    fireEvent.click(screen.getByRole("button", { name: /La lumière/ }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
