/**
 * Asserts that a number is an integer greater than or equal to a minimum.
 *
 * @param value Number to validate.
 * @param name Parameter name included in the thrown error message.
 * @param min Inclusive minimum allowed value; defaults to 0.
 * @throws Error when value is nullish, non-integer, or lower than min.
 */
export function assertInteger(value: number, name: string, min: number = 0): void {
  if (value == null || !Number.isInteger(value) || value < min) {
    throw new Error(`${name}: ${value} must be an integer >= ${min}.`);
  }
}

/**
 * Asserts that a number is an integer greater than or equal to zero.
 *
 * @param value Number to validate.
 * @param name Parameter name included in the thrown error message.
 * @throws Error when value is nullish, non-integer, or negative.
 */
export function assertNonNegativeInteger(value: number, name: string): void {
  if (value == null || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name}: ${value} must be a non-negative integer.`);
  }
}

/**
 * Asserts that a number is an integer greater than zero.
 *
 * @param value Number to validate.
 * @param name Parameter name included in the thrown error message.
 * @throws Error when value is nullish, non-integer, zero, or negative.
 */
export function assertPositiveInteger(value: number, name: string): void {
  if (value == null || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name}: ${value} must be a positive integer.`);
  }
}

/**
 * Asserts that a string uses the app's accepted ISO date format.
 *
 * @param value Date string in YYYY-MM-DD format, optionally followed by a UTC time component.
 * @throws Error when the value does not match the accepted ISO date pattern.
 */
export function assertIsoDateString(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/.test(value)) {
    throw new Error(`Value: ${value} is not a valid ISO date string.`);
  }
}

/**
 * Asserts that a string is a short date.
 *
 * @param value Date string expected in YYYY-MM-DD format.
 * @throws Error when the value is not a YYYY-MM-DD date string.
 */
export function assertShortDateString(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Value: ${value} is not a valid short date string (YYYY-MM-DD).`);
  }
}

/**
 * Asserts that a value is a string with non-whitespace content.
 *
 * @param value Value to validate.
 * @param name Parameter name included in the thrown error message.
 * @throws Error when value is not a string or trims to an empty string.
 */
export function assertNonEmptyString(value: string, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string.`);
  }
}
