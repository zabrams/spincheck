interface Props {
  score: 0 | 1 | 2 | 3;
  direction: 'left' | 'right' | 'none';
}

export default function BiasGauge({ score, direction }: Props) {
  const value = direction === 'none' ? 0 : direction === 'left' ? -score : score;
  const percentage = ((value + 3) / 6) * 100;

  const indicatorColor =
    direction === 'left' ? '#3b82f6' : direction === 'right' ? '#ef4444' : '#6b7280';

  return (
    <div className="select-none">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span className="text-blue-400 font-medium">← Left</span>
        <span>Neutral</span>
        <span className="text-red-400 font-medium">Right →</span>
      </div>

      <div className="relative h-3 rounded-full overflow-visible">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-gray-700 to-red-600" />

        {[-3, -2, -1, 0, 1, 2, 3].map((tick) => (
          <div
            key={tick}
            className="absolute top-0 bottom-0 w-px bg-gray-900/60"
            style={{ left: `${((tick + 3) / 6) * 100}%` }}
          />
        ))}

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-700 ease-out"
          style={{ left: `${percentage}%`, backgroundColor: indicatorColor }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-600 mt-4 px-0">
        {['3', '2', '1', '0', '1', '2', '3'].map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}
