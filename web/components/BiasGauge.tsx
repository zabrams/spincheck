interface Props {
  score: number;
  direction: 'left' | 'right' | 'none';
}

const MAX = 10;

export default function BiasGauge({ score, direction }: Props) {
  const clamped = Math.max(0, Math.min(MAX, score));
  const value = direction === 'none' ? 0 : direction === 'left' ? -clamped : clamped;
  const percentage = ((value + MAX) / (2 * MAX)) * 100;

  const indicatorColor =
    direction === 'left' ? '#2563eb' : direction === 'right' ? '#dc2626' : '#9ca3af';

  const numberLabels = [MAX, MAX / 2, 0, MAX / 2, MAX];

  return (
    <div className="select-none">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span className="text-blue-600 font-medium">← Left</span>
        <span>Neutral</span>
        <span className="text-red-600 font-medium">Right →</span>
      </div>

      <div className="relative h-3 rounded-full overflow-visible">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-gray-200 to-red-500" />

        {/* Tick marks every 2 units; center tick stronger */}
        {[-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10].map((tick) => (
          <div
            key={tick}
            className={`absolute top-0 bottom-0 ${tick === 0 ? 'w-0.5 bg-white/80' : 'w-px bg-white/50'}`}
            style={{ left: `${((tick + MAX) / (2 * MAX)) * 100}%` }}
          />
        ))}

        {/* Indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md ring-1 ring-gray-300 transition-all duration-700 ease-out"
          style={{ left: `${percentage}%`, backgroundColor: indicatorColor }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-4 tabular-nums">
        {numberLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}
