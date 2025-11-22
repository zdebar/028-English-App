import { useState, useEffect } from "react";

export default function Overlay({
  onClose,
  target,
}: {
  onClose?: () => void;
  target?: string;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    function updateRect() {
      if (target) {
        timeoutId = setTimeout(() => {
          const el = document.querySelector(target);
          if (el) {
            setRect(el.getBoundingClientRect());
          } else {
            setRect(null);
          }
        }, 50);
      }
    }
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [target]);

  return (
    <div
      className="fixed inset-0 z-1000"
      onClick={handleOverlayClick}
      style={{ pointerEvents: "auto" }}
    >
      <svg
        width="100vw"
        height="100vh"
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
      >
        <defs>
          <mask id="hole">
            <rect width="100vw" height="100vh" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100vw"
          height="100vh"
          fill="rgba(0,0,0,0.5)"
          mask="url(#hole)"
        />
      </svg>
    </div>
  );
}
