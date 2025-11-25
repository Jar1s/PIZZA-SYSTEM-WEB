'use client';

interface PizzaPoundLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function PizzaPoundLogo({ className = '', width = 200, height = 50 }: PizzaPoundLogoProps) {
  // Scale factor to fit better in header
  const scale = Math.min(width / 200, height / 50);
  const scaledWidth = 200 * scale;
  const scaledHeight = 50 * scale;
  
  return (
    <svg
      width={scaledWidth}
      height={scaledHeight}
      viewBox="0 0 200 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* PIZZA text - top line */}
      <text
        x="0"
        y="22"
        fontSize="18"
        fontWeight="900"
        fontFamily="Arial Black, sans-serif"
        fill="#F5F5DC"
        style={{
          letterSpacing: '2px',
        }}
      >
        <tspan
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke fill"
        >
          PIZZA
        </tspan>
      </text>

      {/* POUND text - bottom line (slightly indented to the right) */}
      <text
        x="8"
        y="42"
        fontSize="18"
        fontWeight="900"
        fontFamily="Arial Black, sans-serif"
        fill="#F5F5DC"
        style={{
          letterSpacing: '2px',
        }}
      >
        <tspan
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke fill"
        >
          POUND
        </tspan>
      </text>
    </svg>
  );
}


