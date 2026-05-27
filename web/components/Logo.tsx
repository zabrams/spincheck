interface Props {
  size?: number;
  className?: string;
}

/**
 * SpinCheck logo — a balance scale tipped slightly, with blue (left)
 * and red (right) plates representing the political spectrum.
 *
 * The "skeleton" of the scale uses currentColor so it auto-adapts to
 * the surrounding text color. The plates are explicitly blue/red.
 */
export default function Logo({ size = 48, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="SpinCheck logo"
    >
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none">
        {/* Horizontal beam */}
        <line x1="20" y1="42" x2="108" y2="42" />
        {/* Central pillar */}
        <line x1="64" y1="42" x2="64" y2="102" />
        {/* Base */}
        <line x1="42" y1="102" x2="86" y2="102" />
        {/* Left arm (slightly higher — tipped scale) */}
        <line x1="22" y1="42" x2="22" y2="62" />
        {/* Right arm (slightly lower) */}
        <line x1="106" y1="42" x2="106" y2="70" />
      </g>
      {/* Pivot dot */}
      <circle cx="64" cy="42" r="4.5" fill="currentColor" />
      {/* Left plate (blue) */}
      <line
        x1="6" y1="62" x2="38" y2="62"
        stroke="#3b82f6" strokeWidth="7" strokeLinecap="round"
      />
      {/* Right plate (red) */}
      <line
        x1="90" y1="70" x2="122" y2="70"
        stroke="#ef4444" strokeWidth="7" strokeLinecap="round"
      />
    </svg>
  );
}
