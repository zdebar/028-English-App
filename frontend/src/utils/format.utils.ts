export function formatProgressChange(value: number): string {
  if (value > 0) return `+ ${value}`;
  if (value < 0) return `- ${Math.abs(value)}`;
  return '0';
}
