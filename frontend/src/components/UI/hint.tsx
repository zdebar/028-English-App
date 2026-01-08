type HintProps = {
  visibility: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Hint component for displaying contextual hints.
 */
export default function Hint({ visibility, children, className = '', style }: HintProps) {
  return (
    visibility && (
      <div
        className={`text-help pointer-events-none absolute z-2000 ${className}`}
        style={{
          ...style,
        }}
      >
        {children}
      </div>
    )
  );
}
