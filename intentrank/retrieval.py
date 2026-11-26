"""Exact BM25 retrieval over a compact inverted index; stable ranking on ties."""
from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
import json
import numpy as np
from .text import tokens


def top_k(scores: np.ndarray, k: int) -> np.ndarray:
    """Deterministic descending score, ascending corpus row on ties."""
    return np.lexsort((np.arange(len(scores)), -scores))[:k]


class BM25:
    def __init__(self, vocabulary: dict[str, int], offsets: np.ndarray,
                 doc_ids: np.ndarray, weights: np.ndarray, size: int):
        self.vocabulary, self.offsets = vocabulary, offsets
        self.doc_ids, self.weights, self.size = doc_ids, weights, size

    @classmethod
    def build(cls, documents: list[str], k1: float = 1.2, b: float = 0.75) -> 'BM25':
        counts = [Counter(tokens(d)) for d in documents]
        lengths = np.array([sum(c.values()) for c in counts])
        average = max(float(lengths.mean()), 1)
        postings = defaultdict(list)
        for i, count in enumerate(counts):
            for word, tf in count.items():
                postings[word].append((i, tf))
        vocabulary, offsets, ids, weights = {}, [0], [], []
        for word in sorted(postings):
            vocabulary[word] = len(vocabulary)
            rows = postings[word]
            idf = np.log(1 + (len(documents) - len(rows) + 0.5) / (len(rows) + 0.5))
            for row, tf in rows:
                ids.append(row)
                weights.append(idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * lengths[row] / average)))
            offsets.append(len(ids))
        return cls(vocabulary, np.array(offsets, dtype=np.int64),
                   np.array(ids, dtype=np.int32), np.array(weights, dtype=np.float32), len(documents))

    def score(self, query: str) -> np.ndarray:
        scores = np.zeros(self.size, dtype=np.float32)
        for word in set(tokens(query)):
            term = self.vocabulary.get(word)
            if term is not None:
                lo, hi = self.offsets[term:term + 2]
                scores[self.doc_ids[lo:hi]] += self.weights[lo:hi]
        return scores

    def save(self, directory: Path) -> None:
        (directory / 'vocabulary.json').write_text(json.dumps(self.vocabulary))
        np.savez_compressed(directory / 'bm25.npz', offsets=self.offsets,
                            doc_ids=self.doc_ids, weights=self.weights, size=self.size)

    @classmethod
    def load(cls, directory: Path) -> 'BM25':
        data = np.load(directory / 'bm25.npz')
        return cls(json.loads((directory / 'vocabulary.json').read_text()),
                   data['offsets'], data['doc_ids'], data['weights'], int(data['size']))


def reciprocal_rank_fusion(lexical: np.ndarray, semantic: np.ndarray, count: int = 100) -> tuple[np.ndarray, np.ndarray]:
    """Union of top-100 per retriever; no judgment labels enter candidate selection."""
    a, b = top_k(lexical, count), top_k(semantic, count)
    candidates = np.union1d(a, b)
    fused = np.zeros(len(lexical), dtype=np.float32)
    for rows in (a, b):
        fused[rows] += 1 / (60 + np.arange(1, len(rows) + 1))
    return candidates, fused
