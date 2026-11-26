"""One retrieval pipeline used by the API, offline evaluation, and CLI smoke tests."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from threading import Lock
import gzip
import json
import time
import numpy as np
from .encoder import Encoder
from .features import FeatureExtractor
from .ranker import TreeRanker
from .retrieval import BM25, reciprocal_rank_fusion, top_k
from .text import attributes, normalize, tokens


class SearchEngine:
    def __init__(self, directory: Path):
        with gzip.open(directory / 'catalogue.json.gz', 'rt', encoding='utf-8') as file:
            self.products = json.load(file)
        self.embeddings = np.load(directory / 'embeddings.npy', mmap_mode='r')
        self.lexical = BM25.load(directory)
        self.encoder = Encoder(directory / 'encoder')
        self.extractor = FeatureExtractor(self.products)
        self.ranker = TreeRanker(json.loads((directory / 'ranker.json').read_text()))
        self.lock = Lock()

    @lru_cache(maxsize=128)
    def embed_query(self, query: str) -> np.ndarray:
        return self.encoder.encode([query])[0]

    def retrieve(self, query: str, query_vector=None):
        vector = self.embed_query(query) if query_vector is None else query_vector
        lexical = self.lexical.score(query)
        semantic = self.embeddings @ vector
        candidates, fused = reciprocal_rank_fusion(lexical, semantic)
        return lexical, semantic, candidates, fused

    def describe(self, row: int, query: str, lexical, semantic, score, rank: int) -> dict:
        product = self.products[int(row)]
        body = set(tokens(f"{product['name']} {product['category']} {product['features']} {product['description']}"))
        requested = attributes(query)
        return {**{k: v for k, v in product.items() if k != 'features'}, 'rank': rank,
                'score': round(float(score), 4), 'lexical_score': round(float(lexical[row]), 3),
                'semantic_score': round(float(semantic[row]), 4),
                'matched_terms': sorted(set(tokens(query)) & body),
                'missing_attributes': {k: [x for x in v if x not in body] for k, v in requested.items()
                                       if any(x not in body for x in v)}}

    def search(self, query: str, mode: str = 'learned', limit: int = 10, category: str | None = None) -> dict:
        started = time.perf_counter()
        with self.lock:
            lexical, semantic, candidates, fused = self.retrieve(query)
            retrieved = time.perf_counter()
            if category:
                candidates = np.array([i for i in candidates if self.products[int(i)]['category'] == category], dtype=int)
            features = self.extractor.transform(query, candidates, lexical, semantic, fused)
            learned_scores = self.ranker.predict(features)
            learned = candidates[top_k(learned_scores, len(candidates))]
            all_scores = {'bm25': lexical, 'semantic': semantic, 'hybrid': fused}
            if mode == 'learned':
                selected = learned[:limit]
                result_scores = {int(row): float(score) for row, score in zip(candidates, learned_scores)}
            else:
                ranked = top_k(all_scores[mode], len(self.products))
                if category:
                    ranked = np.array([i for i in ranked if self.products[int(i)]['category'] == category])
                if mode in ('bm25', 'hybrid'):
                    ranked = ranked[all_scores[mode][ranked] > 0]
                selected = ranked[:limit]
                result_scores = {int(i): float(all_scores[mode][i]) for i in selected}
            baseline = top_k(lexical, len(self.products))
            if category:
                baseline = np.array([i for i in baseline if self.products[int(i)]['category'] == category])
            baseline = baseline[lexical[baseline] > 0][:limit]
            results = [self.describe(int(row), query, lexical, semantic, result_scores[int(row)], i + 1)
                       for i, row in enumerate(selected)]
            comparison = [self.describe(int(row), query, lexical, semantic, lexical[row], i + 1)
                          for i, row in enumerate(baseline)]
        finished = time.perf_counter()
        return {'query': query, 'normalized_query': normalize(query), 'mode': mode,
                'attributes': attributes(query), 'tokens': sorted(set(tokens(query))),
                'results': results, 'baseline': comparison,
                'candidate_count': len(candidates), 'catalogue_count': len(self.products),
                'low_similarity': bool(float(semantic.max()) < 0.25),
                'timing': {'retrieval_ms': round((retrieved - started) * 1000, 1),
                           'ranking_ms': round((finished - retrieved) * 1000, 1),
                           'total_ms': round((finished - started) * 1000, 1)},
                'score_note': 'Ranking scores are model outputs, not probabilities. Attribute matches are text evidence, not verified product specifications.'}
