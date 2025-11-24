export default function Hint({
  visibility,
  children,
  style,
  className = "",
}: {
  visibility: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    visibility && (
      <div
        className={`text-help absolute z-2000 ${className}`}
        style={{
          pointerEvents: "none",
          ...style,
        }}
      >
        {children}
      </div>
    )
  );
}
