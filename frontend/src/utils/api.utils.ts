export function parseId(rawId: string | undefined): number | null {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
