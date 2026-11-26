"""Canonical relevance judgments. Duplicate rows are not independent training pairs."""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path
import csv

GRADES = {'Irrelevant': 0, 'Partial': 1, 'Exact': 2}
POLICY = ('Collapse repeated identical query-product judgments. Exclude pairs with '
          'conflicting labels rather than inventing a consensus. Apply before fitting or scoring.')


def canonicalize(rows: list[dict]) -> tuple[list[dict], dict]:
    labels_by_pair: dict[tuple[int, int], set[str]] = defaultdict(set)
    for row in rows:
        if row['label'] not in GRADES:
            raise ValueError(f"Unknown relevance label: {row['label']}")
        labels_by_pair[(int(row['query_id']), int(row['product_id']))].add(row['label'])
    conflicts = {pair for pair, labels in labels_by_pair.items() if len(labels) > 1}
    clean = []
    for (query_id, product_id), labels in sorted(labels_by_pair.items()):
        if (query_id, product_id) in conflicts:
            continue
        label = next(iter(labels))
        clean.append({'query_id': query_id, 'product_id': product_id,
                      'label': label, 'grade': GRADES[label]})
    report = {'raw_rows': len(rows), 'unique_pairs_before_conflict_filter': len(labels_by_pair),
              'duplicate_extra_rows': len(rows) - len(labels_by_pair),
              'conflicting_pairs_excluded': len(conflicts), 'canonical_pairs': len(clean),
              'policy': POLICY}
    return clean, report


def load_judgments(path: Path) -> tuple[list[dict], dict]:
    with path.open(encoding='utf-8', newline='') as file:
        return canonicalize(list(csv.DictReader(file, delimiter='\t')))
