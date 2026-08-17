'use client';

interface SparklineProps {
  values: number[];
  className?: string;
  stroke?: string;
}

export function Sparkline({ values, className, stroke = '#3B82F6' }: SparklineProps) {
  const width = 120;
  const height = 28;
  if (!values.length || values.every((v) => v === 0)) {
    return <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1={height - 2} x2={width} y2={height - 2} stroke="#E4E4E7" strokeWidth="1.5" /></svg>;
  }
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => {
    const x = values.length > 1 ? i * step : width;
    const y = height - 2 - (v / max) * (height - 4);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L${width} ${height} L0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill={stroke} opacity="0.08" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={stroke} />
    </svg>
  );
}
