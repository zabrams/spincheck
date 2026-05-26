'use client';

import { useState } from 'react';
import type { BiasAnalysis } from '@/types/analysis';
import BiasGauge from './BiasGauge';

interface Props {
  analysis: BiasAnalysis;
}

type Section = 'analysis' | 'perspectives' | 'reading';

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

  // Article's view takes the color of the article's bias direction
  const articleViewColor = direction === 'left' ? 'text-blue-400 border-blue-700/30 bg-blue-900/20'
    : direction === 'right' ? 'text-red-400 border-red-700/30 bg-red-900/20'
    : 'text-gray-400 border-gray-700/30 bg-gray-800/20';

  // Opposing view takes the opposite color
  const opposingViewColor = direction === 'left' ? 'text-red-400 border-red-700/30 bg-red-900/20'
    : direction === 'right' ? 'text-blue-400 border-blue-700/30 bg-blue-900/20'
    : 'text-gray-400 border-gray-700/30 bg-gray-800/20';

  const articleViewLabel = direction === 'left' ? 'Progressive Perspective'
    : direction === 'right' ? 'Conservative Perspective'
    : "Article's View";

  const opposingViewLabel = direction === 'left' ? 'Conservative Counter-Argument'
    : direction === 'right' ? 'Progressive Counter-Argument'
    : 'Opposing View';

  const tabs: { id: Section; label: string }[] = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'perspectives', label: 'Perspectives' },
    { id: 'reading', label: 'Additional Reading' },
  ];

  return (
    <div className="mt-8 space-y-4 animate-in fade-in duration-500">
      {/* Score card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {scoreLabel}{directionLabel}
            </div>
            <p className="text-gray-400 mt-1 text-sm">{analysis.summary}</p>
          </div>
          <div className={`text-5xl font-black tabular-nums ${scoreColor}`}>{scoreDisplay}</div>
        </div>

        <BiasGauge score={score} direction={direction} />

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge active={analysis.isEditorial} trueLabel="Editorial" falseLabel="Factual Reporting" trueIcon="📝" falseIcon="📰" warnOnTrue />
          <Badge active={!analysis.presentsBothSides} trueLabel="One-Sided" falseLabel="Presents Both Sides" trueIcon="✗" falseIcon="✓" warnOnTrue />
          <Badge active={analysis.usesConjecture} trueLabel="Uses Conjecture" falseLabel="Fact-Based" trueIcon="⚠" falseIcon="✓" warnOnTrue />
        </div>
      </div>

      {/* Detail sections — always show even for score 0 so neutral articles show perspectives */}
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
          {/* ── Analysis tab ── */}
          {activeSection === 'analysis' && (
            <div className="space-y-6">
              <div className="text-gray-300 leading-relaxed space-y-3 text-sm">
                {score === 0 ? (
                  <p className="text-gray-400">This article does not show meaningful political bias. It appears to present information factually without a detectable ideological slant.</p>
                ) : (
                  analysis.analysis.split('\n').filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                )}
              </div>

              {analysis.evidence.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Evidence from the article
                  </h3>
                  <ul className="space-y-2">
                    {analysis.evidence.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-gray-600 shrink-0 font-mono">{i + 1}.</span>
                        <span className="text-gray-300 italic border-l-2 border-gray-700 pl-3">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Perspectives tab ── */}
          {activeSection === 'perspectives' && (
            <div className="space-y-5">
              {direction === 'none' ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-3">⚖️</div>
                  <p className="text-gray-300 text-sm font-medium">This article presents a balanced perspective.</p>
                  <p className="text-gray-500 text-sm mt-1">No clear ideological slant was detected — both sides of the issue are represented fairly.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    Topic: <span className="text-gray-300">{analysis.perspectives.topic}</span>
                  </p>

                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${articleViewColor.split(' ')[0]}`}>
                      1 · Article&apos;s View — {articleViewLabel}
                    </div>
                    <div className={`rounded-lg border p-4 text-sm text-gray-300 leading-relaxed ${articleViewColor.split(' ').slice(1).join(' ')}`}>
                      {analysis.perspectives.articleView}
                    </div>
                  </div>

                  {analysis.perspectives.opposingView && (
                    <div>
                      <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${opposingViewColor.split(' ')[0]}`}>
                        2 · {opposingViewLabel}
                      </div>
                      <div className={`rounded-lg border p-4 text-sm text-gray-300 leading-relaxed ${opposingViewColor.split(' ').slice(1).join(' ')}`}>
                        {analysis.perspectives.opposingView}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Additional Reading tab ── */}
          {activeSection === 'reading' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 pb-2 border-b border-gray-800">
                Below are a few suggested articles if you&apos;d like to learn more about this topic:
              </p>
              {analysis.furtherReading.length === 0 ? (
                <p className="text-gray-500 text-sm">No additional reading suggested.</p>
              ) : (
                <ul className="space-y-4">
                  {analysis.furtherReading.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-blue-500 shrink-0 font-bold">{i + 1}</span>
                      <div>
                        <p className="text-gray-300">{item.description}</p>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(item.searchQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs mt-1.5 inline-flex items-center gap-1"
                        >
                          Search: &ldquo;{item.searchQuery}&rdquo; →
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({
  active, trueLabel, falseLabel, trueIcon, falseIcon, warnOnTrue,
}: {
  active: boolean; trueLabel: string; falseLabel: string;
  trueIcon: string; falseIcon: string; warnOnTrue: boolean;
}) {
  const isWarning = warnOnTrue ? active : !active;
  const colors = isWarning
    ? 'bg-red-900/30 text-red-400 border-red-700/40'
    : 'bg-green-900/30 text-green-400 border-green-700/40';
  return (
    <span className={`px-3 py-1 rounded-full text-xs border ${colors}`}>
      {active ? trueIcon : falseIcon} {active ? trueLabel : falseLabel}
    </span>
  );
}
