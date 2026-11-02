/**
 * Asserts that a value is a function.
 *
 * @param value Value to validate.
 * @param name Parameter name included in the thrown error message.
 * @throws TypeError when value is not a function.
 */
export function assertFunction(value: unknown, name: string): void {
  if (typeof value !== 'function') {
    throw new TypeError(`${name} must be a function.`);
  }
}

/**
 * Asserts that a value is a non-empty array.
 *
 * @param value Value to validate.
 * @param name Parameter name included in the thrown error message.
 * @throws Error when value is not an array or is empty.
 */
export function assertNonEmptyArray(value: unknown, name: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} must be a non-empty array.`);
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
