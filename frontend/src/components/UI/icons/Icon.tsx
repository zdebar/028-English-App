export interface IconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

export default function Icon({
  className = '',
  size = 24,
  strokeWidth = 1.5,
  strokeColor = 'currentColor',
  fillColor = 'none',
  children,
  ...rest
}: IconProps & { children: React.ReactNode } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      className={className}
      viewBox="0 0 24 24"
      {...rest}
    >
      {children}
    </svg>
  );
}
