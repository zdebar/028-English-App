import { describe, it, expect } from "vitest";
import { validateISODateString } from "../validation.utils";

describe("validateISODateString", () => {
  it("should not throw an error for a valid ISO date string", () => {
    const validDate = "2023-11-13T12:34:56.789Z";
    expect(() => validateISODateString(validDate, "testDate")).not.toThrow();
  });

  it("should throw an error for an invalid ISO date string", () => {
    const invalidDate = "2023-13-T25:61:61.999Z";
    expect(() => validateISODateString(invalidDate, "testDate")).toThrow(
      'testDate: "2023-13-T25:61:61.999Z"  must be a valid ISO 8601 date string.'
    );
  });

  it("should throw an error for a non-date string", () => {
    const nonDate = "not-a-date";
    expect(() => validateISODateString(nonDate, "testDate")).toThrow(
      'testDate: "not-a-date"  must be a valid ISO 8601 date string.'
    );
  });

  it("should throw an error for an empty string", () => {
    const emptyString = "";
    expect(() => validateISODateString(emptyString, "testDate")).toThrow(
      'testDate: ""  must be a valid ISO 8601 date string.'
    );
  });

  it("should throw an error for a valid ISO string with an invalid calendar date", () => {
    const invalidCalendarDate = "2023-02-30T12:34:56Z";
    expect(() =>
      validateISODateString(invalidCalendarDate, "testDate")
    ).toThrow(
      'testDate: "2023-02-30T12:34:56Z" must be a valid calendar date.'
    );
  });
});
