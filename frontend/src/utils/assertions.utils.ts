/**
 * Validates that a value is an integer within a range.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @param min The minimum value (inclusive). Defaults to 0.
 * @throws Error if the value is not an integer or out of range.
 */
export function assertInteger(value: number, name: string, min: number = 0): void {
  if (value == null || !Number.isInteger(value) || value < min) {
    throw new Error(`${name}: ${value} must be an integer >= ${min}.`);
  }
}

/**
 * Validates that a value is a non-negative integer (>= 0).
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a non-negative integer.
 */
export function assertNonNegativeInteger(value: number, name: string): void {
  if (value == null || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name}: ${value} must be a non-negative integer.`);
  }
}

/**
 * Validates that a value is a positive integer (> 0).
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a positive integer.
 */
export function assertPositiveInteger(value: number, name: string): void {
  if (value == null || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name}: ${value} must be a positive integer.`);
  }
}
