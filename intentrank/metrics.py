"""Ranking metrics with explicit gain semantics and query-level bootstrap uncertainty."""
import numpy as np


def ndcg(relevance, ideal_relevance=None, k=10) -> float:
    relevance = np.asarray(relevance, dtype=float)[:k]
    ideal = np.sort(np.asarray(ideal_relevance if ideal_relevance is not None else relevance, dtype=float))[::-1][:k]
    def dcg(values):
        return float(np.sum((np.power(2.0, values) - 1) / np.log2(np.arange(len(values)) + 2)))
    denominator = dcg(ideal)
    return dcg(relevance) / denominator if denominator > 0 else 0.0


def bootstrap_interval(values, seed=42, samples=2000):
    values = np.asarray(values, dtype=float)
    rng = np.random.default_rng(seed)
    means = values[rng.integers(0, len(values), size=(samples, len(values)))].mean(axis=1)
    return [float(v) for v in np.percentile(means, [2.5, 97.5])]
