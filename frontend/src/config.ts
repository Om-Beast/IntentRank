import type { Mode } from './types';
export const REPO = 'https://github.com/Om-Beast/IntentRank';
export const modes: Record<Mode, string> = {
  learned: 'IntentRank',
  bm25: 'BM25 keyword',
  semantic: 'MiniLM semantic',
  hybrid: 'Hybrid RRF',
};
export const examples = [
  'sofa with ottoman',
  'turquoise pillows',
  'acrylic clear chair',
  'driftwood mirror',
];
export const percent = (v: number) => `${(v * 100).toFixed(1)}%`;
export const fmt = (n: number) => new Intl.NumberFormat('en').format(n);
