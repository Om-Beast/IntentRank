"""Group near-duplicate queries before assigning train/validation/test partitions."""
from __future__ import annotations
from difflib import SequenceMatcher
import numpy as np
from .text import tokens


def split_queries(queries: list[dict], seed: int = 42) -> dict[str, list[int]]:
    parents = list(range(len(queries)))

    def root(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i

    bags = [set(tokens(q['query'])) for q in queries]
    strings = [' '.join(sorted(bag)) for bag in bags]
    for i in range(len(queries)):
        for j in range(i):
            jaccard = len(bags[i] & bags[j]) / max(len(bags[i] | bags[j]), 1)
            if jaccard >= 0.75 or SequenceMatcher(None, strings[i], strings[j]).ratio() >= 0.88:
                parents[root(i)] = root(j)
    groups = {}
    for i, query in enumerate(queries):
        groups.setdefault(root(i), []).append(int(query['query_id']))
    ordered = list(groups.values())
    np.random.default_rng(seed).shuffle(ordered)
    splits = {'train': [], 'validation': [], 'test': []}
    for group in ordered:
        filled = len(splits['train']) + len(splits['validation']) + len(splits['test'])
        partition = 'train' if filled < 0.70 * len(queries) else 'validation' if filled < 0.85 * len(queries) else 'test'
        splits[partition].extend(group)
    return {k: sorted(v) for k, v in splits.items()}
