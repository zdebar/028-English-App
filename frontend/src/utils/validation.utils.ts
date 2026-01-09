import config from '@/config/config';
import type { UserItemLocal } from '@/types/local.types';

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

/**
 * Validates that a value is a positive integer.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a positive integer.
 */
export function validatePositiveInteger(value: number, name: string): void {
  validateInteger(value, name, 1);
}

/**
 * Validates that a value is a non-negative integer.
 * @param value The name of the parameter (used in error messages).
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a non-negative integer.
 */
export function validateNonNegativeInteger(value: number, name: string): void {
  validateInteger(value, name, 0);
}

/**
 * Validates that the lesson size is a positive integer.
 * @throws Error if the lesson size is not a positive integer.
 */
export function validateLessonSize(): void {
  const lessonSize = config.lesson.lessonSize;
  if (!Number.isInteger(lessonSize) || lessonSize <= 0) {
    throw new Error('config.lesson.lessonSize must be a positive integer.');
  }
}

/**
 * Validates that a value is a non-empty string.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a non-empty string.
 */
export function validateNonEmptyString(value: string, name: string): void {
  if (!value || typeof value !== 'string') {
    throw new Error(`${name} must be a non-empty string.`);
  }
}

/**
 * Validates that a value is a valid ISO date string.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a valid ISO date string.
 */
export function validateISODateString(value: string, name: string): void {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

  if (!value || !isoDateRegex.test(value)) {
    throw new Error(`${name}: "${value}"  must be a valid ISO 8601 date string.`);
  }

  // Parse the date components
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);

  // Create a Date object and validate the components
  const date = new Date(value);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month || // getUTCMonth() is zero-based
    date.getUTCDate() !== day
  ) {
    throw new Error(`${name}: "${value}" must be a valid calendar date.`);
  }
}

/**
 * Validates that a value is a valid short date string in the format YYYY-MM-DD.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a valid short date string.
 */
export function validateShortDateString(value: string, name: string): void {
  const shortDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!value || !shortDateRegex.test(value)) {
    throw new Error(`${name} must be a valid short date string in the format YYYY-MM-DD.`);
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`${name} must be a valid calendar date.`);
  }
}

/**
 * Validates that a value is an array of non-empty strings.
 * @param value The array to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not an array of non-empty strings.
 */
export function validateStringArray(value: string[], name: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array.`);
  }

  value.forEach((item, index) => {
    validateNonEmptyString(item, `${name}[${index}]`);
  });
}

/**
 * Validates that a value is a Blob.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a Blob.
 */
export function validateBlob(value: Blob, name: string): void {
  if (!(value instanceof Blob)) {
    throw new Error(`${name} must be a Blob.`);
  }
}

/**
 * Validates that a string is in UUID format.
 * @param value The value to validate.
 * @param name The name of the parameter (used in error messages).
 * @throws Error if the value is not a valid UUID.
 */
export function validateUUID(value: string, name: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`${name} must be a valid UUID: ${value}`);
  }
}

export function validateUserItemLocal(localItem: UserItemLocal): void {
  if (!localItem || typeof localItem !== 'object') {
    throw new Error('localItem must be a valid UserItemLocal object.');
  }

  // Additional validations for specific fields
  validateUUID(localItem.user_id, 'localItem.user_id');
  validatePositiveInteger(localItem.item_id, 'localItem.item_id');
  validateNonNegativeInteger(localItem.progress, 'localItem.progress');

  // Validate date fields
  validateISODateString(localItem.started_at, 'localItem.started_at');
  validateISODateString(localItem.updated_at, 'localItem.updated_at');
  validateISODateString(localItem.next_at, 'localItem.next_at');
  validateISODateString(localItem.mastered_at, 'localItem.mastered_at');

  // Special case: Validate `deleted_at` only if it exists
  if (localItem.deleted_at) {
    validateISODateString(localItem.deleted_at, 'localItem.deleted_at');
  }
}
