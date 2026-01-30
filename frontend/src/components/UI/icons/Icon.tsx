import type { JSX } from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  viewBox?: string;
  children?: React.ReactNode;
}

/**
 * A reusable SVG icon component that renders custom icons with configurable properties.
 *
 * @param className - Additional CSS classes to apply to the SVG element. Defaults to an empty string.
 * @param size - The width and height of the SVG element in pixels. Defaults to 24.
 * @param strokeWidth - The width of the stroke for the SVG paths. Defaults to 1.5.
 * @param strokeColor - The color of the stroke. Defaults to 'currentColor'.
 * @param fillColor - The fill color for the SVG. Defaults to 'none'.
 * @param viewBox - The viewBox attribute for the SVG. Defaults to '0 0 24 24'.
 * @param children - The SVG path or other elements to render inside the SVG.
 * @returns {JSX.Element} A JSX element representing the SVG icon.
 */
export default function Icon({
  className = '',
  size = 24,
  strokeWidth = 1.5,
  strokeColor = 'currentColor',
  fillColor = 'none',
  viewBox = '0 0 24 24',
  children,
}: IconProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      className={className}
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}
