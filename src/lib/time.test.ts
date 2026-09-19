import { describe, expect, it } from "vitest";
import { isValidLocalDateTime, localDateTimeToUtc, utcToLocalDateTime } from "./time";

describe("conversion de fuseau", () => {
  it.each(["", "T12:00", "2026-09-19T", "2026-02-30T12:00", "2026-03-29T02:30"])("rejette la saisie invalide ou inexistante %s", (value) => {
    expect(isValidLocalDateTime(value, "Europe/Paris")).toBe(false);
  });
  it("accepte un instant local valide", () => {
    expect(isValidLocalDateTime("2026-09-19T21:00", "Europe/Paris")).toBe(true);
  });
  it("convertit Paris en UTC pendant l’heure d’été", () => {
    expect(localDateTimeToUtc("2026-08-18T21:00", "Europe/Paris").toISOString())
      .toBe("2026-08-18T19:00:00.000Z");
  });

  it("préserve l’instant lors d’un aller-retour", () => {
    const instant = new Date("2026-12-21T03:15:00.000Z");
    const local = utcToLocalDateTime(instant, "America/New_York");
    expect(localDateTimeToUtc(local, "America/New_York").toISOString()).toBe(instant.toISOString());
  });
});
