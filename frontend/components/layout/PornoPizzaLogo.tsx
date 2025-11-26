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
      
      {/* PORNO text - top line */}
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

        {/* Devil emoji (replacing first O) - positioned after P */}
        <g transform="translate(25, -2)">
          {/* Devil face - purple circle */}
          <circle cx="12" cy="12" r="11" fill="#8B00FF" />
          <circle cx="12" cy="12" r="10" fill="#9B1FFF" />
          {/* Horns - pointed */}
          <path d="M 6 4 L 9 1 L 12 4" fill="#6A0DAD" stroke="#4A0080" strokeWidth="0.5" />
          <path d="M 18 4 L 15 1 L 12 4" fill="#6A0DAD" stroke="#4A0080" strokeWidth="0.5" />
          {/* Eyes - white circles */}
          <circle cx="9" cy="11" r="2" fill="#FFFFFF" />
          <circle cx="15" cy="11" r="2" fill="#FFFFFF" />
          {/* Eyebrows - raised */}
          <path d="M 7 8 Q 9 6 11 8" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 13 8 Q 15 6 17 8" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Smile - mischievous */}
          <path d="M 8 15 Q 12 18 16 15" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* R N O - positioned after devil */}
        <text
          x="50"
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
            {/* Cheese layer - yellow */}
            <path
              d="M 1.5 16.5 L 16.5 1.5 L 16.5 16.5 Z"
              fill="#FFD700"
            />
            {/* Pepperoni slices - red circles */}
            <circle cx="7" cy="7" r="3.5" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
            <circle cx="12" cy="9" r="3" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
            <circle cx="9" cy="13" r="3" fill="#FF0000" stroke="#8B0000" strokeWidth="1" />
            {/* Crust detail */}
            <path
              d="M 0 18 L 18 0"
              stroke="#8B4513"
              strokeWidth="1"
              opacity="0.5"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

