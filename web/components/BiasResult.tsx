'use client';

import { useState } from 'react';
import type { BiasAnalysis } from '@/types/analysis';
import BiasGauge from './BiasGauge';

interface Props {
  analysis: BiasAnalysis;
}

type Section = 'analysis' | 'evidence' | 'steelman' | 'reading';

export default function BiasResult({ analysis }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('analysis');

  const { score, direction } = analysis;

  const scoreLabel = ['No Bias', 'Slightly Biased', 'Moderately Biased', 'Strongly Biased'][score];
  const directionLabel =
    direction === 'none' ? '' : direction === 'left' ? ' — Leans Left' : ' — Leans Right';

  const scoreColor =
    direction === 'none'
      ? 'text-gray-400'
      : direction === 'left'
        ? 'text-blue-400'
        : 'text-red-400';

  const scoreDisplay =
    direction === 'none' ? '0' : `${score}${direction === 'left' ? 'L' : 'R'}`;

  const tabs: { id: Section; label: string }[] = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'evidence', label: `Evidence (${analysis.evidence.length})` },
    { id: 'steelman', label: '⚖ Both Sides' },
    { id: 'reading', label: 'Further Reading' },
  ];

  return (
    <div className="mt-8 space-y-4 animate-in fade-in duration-500">
      {/* Score card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {scoreLabel}
              {directionLabel}
            </div>
            <p className="text-gray-400 mt-1 text-sm">{analysis.summary}</p>
          </div>
          <div className={`text-5xl font-black tabular-nums ${scoreColor}`}>{scoreDisplay}</div>
        </div>

        <BiasGauge score={score} direction={direction} />

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge
            active={analysis.isEditorial}
            trueLabel="Editorial"
            falseLabel="Factual Reporting"
            trueIcon="📝"
            falseIcon="📰"
            warnOnTrue
          />
          <Badge
            active={!analysis.presentsBothSides}
            trueLabel="One-Sided"
            falseLabel="Presents Both Sides"
            trueIcon="✗"
            falseIcon="✓"
            warnOnTrue
          />
          <Badge
            active={analysis.usesConjecture}
            trueLabel="Uses Conjecture"
            falseLabel="Fact-Based"
            trueIcon="⚠"
            falseIcon="✓"
            warnOnTrue
          />
        </div>
      </div>

      {/* Detail sections */}
      {score > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === tab.id
                    ? 'text-white border-b-2 border-blue-500 bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeSection === 'analysis' && (
              <div className="text-gray-300 leading-relaxed space-y-3 text-sm">
                {analysis.analysis.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {activeSection === 'evidence' && (
              <ul className="space-y-3">
                {analysis.evidence.length === 0 ? (
                  <p className="text-gray-500 text-sm">No specific evidence highlighted.</p>
                ) : (
                  analysis.evidence.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-gray-600 shrink-0 font-mono">{i + 1}.</span>
                      <span className="text-gray-300 italic border-l-2 border-gray-700 pl-3">{item}</span>
                    </li>
                  ))
                )}
              </ul>
            )}

            {activeSection === 'steelman' && (
              <div>
                <p className="text-gray-500 text-xs mb-4">
                  Topic: <span className="text-gray-300">{analysis.steelMan.topic}</span>
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <div className="text-blue-400 font-semibold text-sm mb-2">Progressive View</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{analysis.steelMan.left}</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                    <div className="text-red-400 font-semibold text-sm mb-2">Conservative View</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{analysis.steelMan.right}</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'reading' && (
              <ul className="space-y-4">
                {analysis.furtherReading.length === 0 ? (
                  <p className="text-gray-500 text-sm">No further reading suggested.</p>
                ) : (
                  analysis.furtherReading.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-blue-500 shrink-0">→</span>
                      <div>
                        <p className="text-gray-300">{item.description}</p>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(item.searchQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block"
                        >
                          Search: &ldquo;{item.searchQuery}&rdquo; →
                        </a>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({
  active,
  trueLabel,
  falseLabel,
  trueIcon,
  falseIcon,
  warnOnTrue,
}: {
  active: boolean;
  trueLabel: string;
  falseLabel: string;
  trueIcon: string;
  falseIcon: string;
  warnOnTrue: boolean;
}) {
  const isWarning = warnOnTrue ? active : !active;
  const label = active ? trueLabel : falseLabel;
  const icon = active ? trueIcon : falseIcon;

  const colors = isWarning
    ? 'bg-red-900/30 text-red-400 border-red-700/40'
    : 'bg-green-900/30 text-green-400 border-green-700/40';

  return (
    <span className={`px-3 py-1 rounded-full text-xs border ${colors}`}>
      {icon} {label}
    </span>
  );
}
