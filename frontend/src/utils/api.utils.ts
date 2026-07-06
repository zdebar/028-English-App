/**
 * Parses a route parameter into a positive integer id.
 *
 * @param rawId Route parameter value from React Router; may be undefined when the route is absent.
 * @returns The parsed positive integer, or null for missing, non-numeric, zero, or negative values.
 */
export function parseId(rawId: string | undefined): number | null {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
