'use client';

interface PornoPizzaLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function PornoPizzaLogo({ className = '', width = 350, height = 80 }: PornoPizzaLogoProps) {
  // Scale factor to fit better in header
  const scale = Math.min(width / 350, height / 80);
  const scaledWidth = 350 * scale;
  const scaledHeight = 80 * scale;
  
  return (
    <svg
      width={scaledWidth}
      height={scaledHeight}
      viewBox="0 0 350 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Pizza Slice - Left Side */}
      <g transform="translate(10, 5)">
        {/* Pizza slice crust (thick golden-brown with darker outline) */}
        <path
          d="M 0 35 L 55 8 A 55 55 0 0 1 55 62 Z"
          fill="#D4A574"
          stroke="#8B4513"
          strokeWidth="3"
        />
        
        {/* Pizza cheese (vibrant yellow) */}
        <path
          d="M 3 33 L 52 8 A 52 52 0 0 1 52 58 Z"
          fill="#FFD700"
        />
        
        {/* Cheese drips from the tip */}
        <ellipse cx="50" cy="18" rx="4" ry="6" fill="#FFD700" />
        <ellipse cx="53" cy="24" rx="3.5" ry="5" fill="#FFD700" />
        <ellipse cx="55" cy="30" rx="3" ry="4.5" fill="#FFD700" />
        
        {/* Pepperoni slices (red with darker outline) */}
        <circle cx="28" cy="22" r="7" fill="#DC143C" stroke="#8B0000" strokeWidth="1.5" />
        <circle cx="38" cy="28" r="7" fill="#DC143C" stroke="#8B0000" strokeWidth="1.5" />
        <circle cx="33" cy="38" r="6.5" fill="#DC143C" stroke="#8B0000" strokeWidth="1.5" />
        
        {/* Pepperoni highlights (lighter red) */}
        <circle cx="27" cy="21" r="2.5" fill="#FF4444" opacity="0.7" />
        <circle cx="37" cy="27" r="2.5" fill="#FF4444" opacity="0.7" />
        <circle cx="32" cy="37" r="2" fill="#FF4444" opacity="0.7" />
        
        {/* Dark outline around entire slice */}
        <path
          d="M 0 35 L 55 8 A 55 55 0 0 1 55 62 Z"
          fill="none"
          stroke="#654321"
          strokeWidth="2.5"
        />
      </g>

      {/* PIZZA PORNO Text - Right Side */}
      <g transform="translate(80, 5)">
        {/* PIZZA text - top line */}
        <text
          x="0"
          y="32"
          fontSize="22"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#F5F5DC"
          style={{
            letterSpacing: '1.5px',
          }}
        >
          <tspan
            stroke="#000000"
            strokeWidth="2"
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
          y="58"
          fontSize="22"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="#F5F5DC"
          style={{
            letterSpacing: '1.5px',
          }}
        >
          <tspan
            stroke="#000000"
            strokeWidth="2"
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

