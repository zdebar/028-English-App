interface InfoIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

export default function InfoIcon({
  className = "",
  size = 24,
  strokeWidth = 1.5,
  strokeColor = "currentColor",
  fillColor = "none",
}: InfoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={fillColor}
      strokeWidth={strokeWidth}
      stroke={strokeColor}
      width={size}
      height={size}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}
