interface Props {
  score: number;
  direction: 'left' | 'right' | 'none';
}

const MAX = 10;

export default function BiasGauge({ score, direction }: Props) {
  // Clamp score to 0-10 just in case
  const clamped = Math.max(0, Math.min(MAX, score));
  const value = direction === 'none' ? 0 : direction === 'left' ? -clamped : clamped;
  const percentage = ((value + MAX) / (2 * MAX)) * 100;

  const indicatorColor =
    direction === 'left' ? '#3b82f6' : direction === 'right' ? '#ef4444' : '#6b7280';

  // Number labels under the gauge — 10, 5, 0, 5, 10
  const numberLabels = [MAX, MAX / 2, 0, MAX / 2, MAX];

  return (
    <div className="select-none">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span className="text-blue-400 font-medium">← Left</span>
        <span>Neutral</span>
        <span className="text-red-400 font-medium">Right →</span>
      </div>

      <div className="relative h-3 rounded-full overflow-visible">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-gray-700 to-red-600" />

        {/* Minor tick marks every 2 units */}
        {[-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10].map((tick) => (
          <div
            key={tick}
            className={`absolute top-0 bottom-0 ${tick === 0 ? 'w-0.5 bg-gray-900/80' : 'w-px bg-gray-900/40'}`}
            style={{ left: `${((tick + MAX) / (2 * MAX)) * 100}%` }}
          />
        ))}

        {/* Indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-700 ease-out"
          style={{ left: `${percentage}%`, backgroundColor: indicatorColor }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-600 mt-4 tabular-nums">
        {numberLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}
