import type { BiasAnalysis } from '@/types/analysis';

/** Slim shape returned by SHORTCUT_SYSTEM_PROMPT — no analysis paragraph, framingEvidence, or furtherReading. */
export type ShortcutAnalysis = Pick<
  BiasAnalysis,
  | 'score'
  | 'direction'
  | 'confidence'
  | 'summary'
  | 'isEditorial'
  | 'presentsBothSides'
  | 'usesEmotionalLanguage'
  | 'hasSelectiveSourcing'
  | 'hasMisleadingHeadline'
  | 'omissionEvidence'
  | 'perspectives'
>;

export function getScoreLabel(score: number): string {
  if (score <= 0) return 'No Bias';
  if (score <= 2) return 'Slight Bias';
  if (score <= 4) return 'Mild Bias';
  if (score <= 6) return 'Moderate Bias';
  if (score <= 8) return 'Strong Bias';
  return 'Extreme Bias';
}

/**
 * Format a slim analysis result as plain text suitable for iOS Shortcuts'
 * "Show Content" action. Shared between the URL/text Shortcut endpoint and
 * the image-based Shortcut endpoint.
 */
export function formatForShortcut(a: ShortcutAnalysis): string {
  const scoreStr =
    a.direction === 'left' ? `${a.score}L`
    : a.direction === 'right' ? `${a.score}R`
    : `${a.score}`;

  const dirLabel =
    a.direction === 'left' ? ' — Leans Left'
    : a.direction === 'right' ? ' — Leans Right'
    : '';

  const scoreLine = `${scoreStr} · ${getScoreLabel(a.score)}${dirLabel}`;

  const tagLines = [
    a.isEditorial ? '📝 Editorial' : '📰 Factual Reporting',
    a.presentsBothSides ? '✓ Presents Both Sides' : '✗ One-Sided',
    a.usesEmotionalLanguage ? '⚠ Emotional Language' : '✓ Neutral Tone',
    a.hasSelectiveSourcing ? '⚠ Selective Sourcing' : '✓ Diverse Sources',
    a.hasMisleadingHeadline ? '⚠ Misleading Headline' : '✓ Accurate Headline',
  ];

  const D = '─────────────────────';

  let out = `⚖️ SpinCheck\n${D}\n`;
  out += `${scoreLine}\n`;
  out += `Confidence: ${a.confidence}\n\n`;
  out += `${a.summary}\n\n`;
  out += tagLines.join('\n') + '\n';

  if (a.perspectives.commonGround) {
    out += `\n${D}\n🤝 COMMON GROUND\n${D}\n`;
    out += `${a.perspectives.commonGround}\n`;
  }

  out += `\n${D}\n📰 ARTICLE'S VIEW\n${D}\n`;
  out += `${a.perspectives.articleView}\n`;

  if (a.perspectives.opposingView) {
    out += `\n${D}\n⚖️ OPPOSING VIEW\n${D}\n`;
    out += `${a.perspectives.opposingView}\n`;
  }

  if (a.omissionEvidence.length > 0) {
    out += `\n${D}\n🎯 WHAT'S MISSING\n${D}\n`;
    a.omissionEvidence.slice(0, 3).forEach((e, i) => {
      out += `${i + 1}. ${e}\n`;
    });
  }

  out += `\n${D}\nspincheck.app`;
  return out.trim();
}
