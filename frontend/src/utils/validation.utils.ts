/**
 * Validates that a value is an integer within a range.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @param min The minimum value (inclusive). Defaults to 0.
 * @throws Error if the value is not an integer or out of range.
 */
export function validateInteger(value: number, name: string, min: number = 0): void {
  if (value == null || !Number.isInteger(value) || value < min) {
    throw new Error(`${name}: ${value} must be an integer >= ${min}.`);
  }
}
