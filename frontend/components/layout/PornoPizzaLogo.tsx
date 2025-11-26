'use client';

interface PornoPizzaLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function PornoPizzaLogo({ className = '', width = 200, height = 50 }: PornoPizzaLogoProps) {
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
      {/* PORNO text - top line */}
      <g transform="translate(0, 0)">
        {/* P */}
        <text
          x="0"
          y="22"
          fontSize="20"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#FFFFFF"
          style={{
            letterSpacing: '2px',
          }}
        >
          <tspan
            stroke="#000000"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
          >
            P
          </tspan>
        </text>

        {/* Devil emoji (replacing first O) */}
        <g transform="translate(20, 0)">
          {/* Devil face - purple */}
          <circle cx="10" cy="12" r="10" fill="#8B00FF" />
          {/* Horns */}
          <path d="M 5 5 L 8 2 L 10 5" stroke="#6A0DAD" strokeWidth="1.5" fill="none" />
          <path d="M 15 5 L 12 2 L 10 5" stroke="#6A0DAD" strokeWidth="1.5" fill="none" />
          {/* Eyes */}
          <circle cx="7" cy="11" r="1.5" fill="#FFFFFF" />
          <circle cx="13" cy="11" r="1.5" fill="#FFFFFF" />
          {/* Smile */}
          <path d="M 7 15 Q 10 17 13 15" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* R N O */}
        <text
          x="40"
          y="22"
          fontSize="20"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#FFFFFF"
          style={{
            letterSpacing: '2px',
          }}
        >
          <tspan
            stroke="#000000"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
          >
            RNO
          </tspan>
        </text>
      </g>

      {/* PIZZ text - bottom line */}
      <g transform="translate(0, 25)">
        {/* P I Z Z */}
        <text
          x="0"
          y="22"
          fontSize="20"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#FFFFFF"
          style={{
            letterSpacing: '2px',
          }}
        >
          <tspan
            stroke="#000000"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
          >
            PIZZ
          </tspan>
        </text>

        {/* Pizza slice emoji (replacing A) */}
        <g transform="translate(80, 0)">
          {/* Pizza slice - triangular */}
          <path
            d="M 0 20 L 20 0 L 20 20 Z"
            fill="#D4A574"
            stroke="#8B4513"
            strokeWidth="2"
          />
          {/* Cheese layer */}
          <path
            d="M 2 18 L 18 2 L 18 18 Z"
            fill="#FFD700"
          />
          {/* Pepperoni slices */}
          <circle cx="8" cy="8" r="3" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
          <circle cx="14" cy="10" r="2.5" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
          <circle cx="10" cy="14" r="2.5" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}

