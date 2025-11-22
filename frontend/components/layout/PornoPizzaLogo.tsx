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
      {/* Pizza Slice - Left Side (slightly tilted) */}
      <g transform="translate(8, 6) rotate(-3)">
        {/* Pizza slice crust - golden-brown with darker brown outline */}
        <path
          d="M 0 30 L 45 6 A 45 45 0 0 1 45 54 Z"
          fill="#D4A574"
          stroke="#8B4513"
          strokeWidth="2.5"
        />
        
        {/* Pizza cheese - bright yellow */}
        <path
          d="M 2 28 L 43 6 A 43 43 0 0 1 43 52 Z"
          fill="#FFD700"
        />
        
        {/* Cheese drips from the tip */}
        <ellipse cx="42" cy="14" rx="3" ry="5" fill="#FFD700" />
        <ellipse cx="44" cy="19" rx="2.5" ry="4" fill="#FFD700" />
        <ellipse cx="45" cy="23" rx="2" ry="3.5" fill="#FFD700" />
        
        {/* Three pepperoni slices - bright red with darker outline */}
        <circle cx="24" cy="18" r="5.5" fill="#FF0000" stroke="#8B0000" strokeWidth="1.5" />
        <circle cx="32" cy="23" r="5.5" fill="#FF0000" stroke="#8B0000" strokeWidth="1.5" />
        <circle cx="28" cy="30" r="5" fill="#FF0000" stroke="#8B0000" strokeWidth="1.5" />
        
        {/* Dark outline around entire slice */}
        <path
          d="M 0 30 L 45 6 A 45 45 0 0 1 45 54 Z"
          fill="none"
          stroke="#654321"
          strokeWidth="2"
        />
      </g>

      {/* PIZZA PORNO Text - Right Side */}
      <g transform="translate(60, 2)">
        {/* PIZZA text - top line */}
        <text
          x="0"
          y="20"
          fontSize="16"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#F5F5DC"
          style={{
            letterSpacing: '1.5px',
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

        {/* PORNO text - bottom line */}
        <text
          x="0"
          y="38"
          fontSize="16"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#F5F5DC"
          style={{
            letterSpacing: '1.5px',
          }}
        >
          <tspan
            stroke="#000000"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
          >
            PORNO
          </tspan>
        </text>
      </g>
    </svg>
  );
}

