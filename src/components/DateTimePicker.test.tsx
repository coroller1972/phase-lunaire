import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DateTimePicker } from "./DateTimePicker";

afterEach(cleanup);
it("permet d’effacer puis corriger la date sans transmettre de valeur invalide aux calculs", () => {
  const onChange = vi.fn();
  const onClose = vi.fn();
  render(<DateTimePicker open observation={{ label: "Paris", latitude: 48.8566, longitude: 2.3522, elevationM: 0, timezone: "Europe/Paris", localDateTime: "2026-09-19T21:00" }} onChange={onChange} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText("Date"), { target: { value: "" } });
  expect(screen.getByRole("button", { name: "Observer cet instant" })).toBeDisabled();
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-20" } });
  fireEvent.click(screen.getByRole("button", { name: "Observer cet instant" }));
  expect(onChange).toHaveBeenCalledWith("2026-09-20T21:00");
  expect(onClose).toHaveBeenCalledOnce();
});
