import { useState } from "react";
import { CalendarBlank, Clock, X } from "@phosphor-icons/react";
import { isValidLocalDateTime } from "../lib/time";
import type { ObservationInput } from "../types";

interface DateTimePickerProps {
  open: boolean;
  observation: ObservationInput;
  onClose: () => void;
  onChange: (localDateTime: string) => void;
}

export function DateTimePicker(props: DateTimePickerProps) {
  return props.open ? <DateTimeForm key={`${props.observation.timezone}-${props.observation.localDateTime}`} {...props} /> : null;
}

function DateTimeForm({ observation, onClose, onChange }: DateTimePickerProps) {
  const [date, setDate] = useState(observation.localDateTime.split("T")[0]);
  const [time, setTime] = useState(observation.localDateTime.split("T")[1]);
  const value = `${date}T${time}`;
  const valid = isValidLocalDateTime(value, observation.timezone);
  return (
    <form className="control-popover datetime-popover" role="dialog" aria-modal="false" aria-labelledby="datetime-title" onSubmit={(event) => {
      event.preventDefault();
      if (valid) { onChange(value); onClose(); }
    }}>
      <div className="popover-heading">
        <div><span className="eyebrow">Instant d’observation</span><h2 id="datetime-title">Date et heure locales</h2></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer"><X size={20} weight="light" /></button>
      </div>
      <div className="datetime-grid">
        <label><CalendarBlank size={19} weight="light" /><span>Date</span><input autoFocus type="date" required value={date} aria-describedby={!valid ? "datetime-error" : undefined} onChange={(event) => setDate(event.target.value)} /></label>
        <label><Clock size={19} weight="light" /><span>Heure</span><input type="time" required value={time} step="60" aria-describedby={!valid ? "datetime-error" : undefined} onChange={(event) => setTime(event.target.value)} /></label>
      </div>
      <p className="popover-footnote">Heure locale à {observation.label}. Fuseau : <strong>{observation.timezone}</strong>.</p>
      {!valid && <p id="datetime-error" className="error-copy" role="status">Saisissez une date et une heure valides dans ce fuseau, hors heure sautée lors du passage à l’heure d’été.</p>}
      <button type="submit" className="secondary-action" disabled={!valid}>Observer cet instant</button>
    </form>
  );
}
