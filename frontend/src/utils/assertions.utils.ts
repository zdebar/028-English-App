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

/**
 * Asserts that the provided string is a valid ISO 8601 date format.
 * Validates dates in the format YYYY-MM-DD with optional time component (HH:mm:ss.sssZ).
 *
 * @param value - The string to validate as an ISO date
 * @throws {Error} If the value is not a valid ISO 8601 date string
 */
export function assertIsoDateString(value: string): void {
  // ISO 8601 regex (YYYY-MM-DD or with time)
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/.test(value)) {
    throw new Error(`Value: ${value} is not a valid ISO date string.`);
  }
}

/**
 * Asserts that the provided string is a valid short date in the format YYYY-MM-DD.
 *
 * @param value - The string to validate as a short date
 * @throws {Error} If the value is not a valid short date string
 */
export function assertShortDateString(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Value: ${value} is not a valid short date string (YYYY-MM-DD).`);
  }
}

/**
 * Asserts that the provided value is a non-empty string.
 *
 * @param value - The value to validate
 * @param name - Parameter name used in the error message
 */
export function assertNonEmptyString(value: string, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string.`);
  }
}
