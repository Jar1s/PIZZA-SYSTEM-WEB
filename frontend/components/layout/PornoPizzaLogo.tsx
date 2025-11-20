'use client';

interface PornoPizzaLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function PornoPizzaLogo({ className = '', width = 200, height = 60 }: PornoPizzaLogoProps) {
  // Scale factor to fit better in header
  const scale = Math.min(width / 200, height / 60);
  const scaledWidth = 200 * scale;
  const scaledHeight = 60 * scale;
  
  return (
    <svg
      width={scaledWidth}
      height={scaledHeight}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Pizza wheel circle - centered, partially obscured by PIZZAPORNO at top */}
      <g transform="translate(100, 35)">
        {/* Outer circle - thick off-white/light grey outline */}
        <circle
          cx="0"
          cy="0"
          r="22"
          stroke="#D4D4D4"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Pizza slices/spokes - radial lines from center to edge (16 spokes) */}
        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle, index) => {
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * 22;
          const y = Math.sin(rad) * 22;
          return (
            <line
              key={index}
              x1="0"
              y1="0"
              x2={x}
              y2={y}
              stroke="#D4D4D4"
              strokeWidth="1.5"
              opacity="0.9"
            />
          );
        })}
      </g>

      {/* PIZZAPORNO text - bold orange, layered on top of wheel (partially covering top of wheel) */}
      <text
        x="100"
        y="25"
        textAnchor="middle"
        fontSize="20"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        fill="#FF9900"
        style={{
          letterSpacing: '1.2px',
        }}
      >
        <tspan
          stroke="#1a1a1a"
          strokeWidth="0.8"
          strokeLinejoin="round"
        >
          PIZZAPORNO
        </tspan>
        <tspan fill="#FF9900" stroke="none">PIZZAPORNO</tspan>
      </text>

      {/* BRATISLAVA text - smaller, lighter grey/off-white, layered on top of wheel */}
      <text
        x="100"
        y="42"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fontFamily="Arial, sans-serif"
        fill="#D4D4D4"
        style={{
          letterSpacing: '0.6px',
        }}
      >
        BRATISLAVA
      </text>
    </svg>
  );
}

