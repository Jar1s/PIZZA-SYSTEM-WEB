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
      {/* Background - black */}
      <rect width="200" height="50" fill="#000000" />
      
      {/* P ORNO text - top line */}
      <g transform="translate(5, 5)">
        {/* P */}
        <text
          x="0"
          y="18"
          fontSize="22"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#FFFFFF"
          style={{
            letterSpacing: '3px',
          }}
        >
          P
        </text>

        {/* Space after P */}
        <text
          x="20"
          y="18"
          fontSize="22"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#FFFFFF"
        >
          {' '}
        </text>

        {/* Blueberry emoji (replacing O in ORNO) - light purple face with white eyes and smile */}
        <g transform="translate(30, -2)">
          {/* Blueberry body - light purple/blue */}
          <circle cx="12" cy="12" r="11" fill="#9370DB" />
          <circle cx="12" cy="12" r="10" fill="#9B7DD9" />
          {/* Stem on top */}
          <ellipse cx="12" cy="2" rx="2" ry="3" fill="#6A0DAD" />
          {/* White oval eyes */}
          <ellipse cx="9" cy="10" rx="2.5" ry="3.5" fill="#FFFFFF" />
          <ellipse cx="15" cy="10" rx="2.5" ry="3.5" fill="#FFFFFF" />
          {/* Wide white smiling mouth */}
          <ellipse cx="12" cy="15" rx="5" ry="3" fill="#FFFFFF" />
        </g>

        {/* R N O - positioned after blueberry */}
        <text
          x="55"
          y="18"
          fontSize="22"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#FFFFFF"
          style={{
            letterSpacing: '3px',
          }}
        >
          RNO
        </text>
      </g>

      {/* PIZZ text - bottom line */}
      <g transform="translate(5, 28)">
        {/* P I Z Z */}
        <text
          x="0"
          y="18"
          fontSize="22"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#FFFFFF"
          style={{
            letterSpacing: '3px',
          }}
        >
          PIZZ
        </text>

        {/* Pizza slice emoji (replacing A) - positioned after PIZZ */}
        <g transform="translate(90, -2)">
          {/* Pizza slice - triangular, angled slightly */}
          <g transform="rotate(-5 10 10)">
            <path
              d="M 0 18 L 18 0 L 18 18 Z"
              fill="#D4A574"
              stroke="#8B4513"
              strokeWidth="1.5"
            />
            {/* Cheese layer - yellow-orange */}
            <path
              d="M 1.5 16.5 L 16.5 1.5 L 16.5 16.5 Z"
              fill="#FFA500"
            />
            {/* Pepperoni slices - red circles */}
            <circle cx="7" cy="7" r="3.5" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
            <circle cx="12" cy="9" r="3" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
            <circle cx="9" cy="13" r="3" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
          </g>
        </g>
      </g>
    </svg>
  );
}

