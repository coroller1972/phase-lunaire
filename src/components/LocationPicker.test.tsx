import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LocationPicker } from "./LocationPicker";

afterEach(cleanup);
it("refuse les coordonnées vides et accepte les décimales françaises", () => {
  const onManualSelect = vi.fn();
  render(<LocationPicker open observation={{ label: "Paris", latitude: 48.8566, longitude: 2.3522, elevationM: 0, timezone: "Europe/Paris", localDateTime: "2026-09-19T21:00" }} onSelect={vi.fn()} onClose={vi.fn()} onManualSelect={onManualSelect} />);
  fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "" } });
  expect(screen.getByRole("button", { name: "Placer sur la Terre" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "48,85" } });
  fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "2,35" } });
  fireEvent.click(screen.getByRole("button", { name: "Placer sur la Terre" }));
  expect(onManualSelect).toHaveBeenCalledWith(48.85, 2.35);
});
