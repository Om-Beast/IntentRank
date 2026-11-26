"""Label-free query/product features shared by training, evaluation, and serving."""
from __future__ import annotations

from functools import lru_cache
import numpy as np
from .text import ATTRIBUTE_GROUPS, attributes, normalize, tokens

ATTRIBUTE_TOKENS = {k: frozenset(tokens(' '.join(v))) for k, v in ATTRIBUTE_GROUPS.items()}

FEATURE_NAMES = ['bm25', 'cosine', 'title_coverage', 'category_coverage',
                 'body_coverage', 'title_phrase', 'title_precision', 'query_length',
                 'title_length', 'color_match', 'color_conflict', 'material_match',
                 'material_conflict', 'style_match', 'size_match', 'setting_match',
                 'numeric_coverage', 'rrf_score']


class FeatureExtractor:
    def __init__(self, products: list[dict]):
        self.products = products

    @lru_cache(maxsize=2048)
    def _fields(self, row: int):
        product = self.products[row]
        title = set(tokens(product['name']))
        category = set(tokens(product['category']))
        body = set(tokens(f"{product['name']} {product['category']} {product['description']} {product['features']}"))
        return title, category, body

    def transform(self, query: str, rows: np.ndarray, lexical: np.ndarray,
                  semantic: np.ndarray, fused: np.ndarray) -> np.ndarray:
        query_tokens = set(tokens(query))
        length = max(len(query_tokens), 1)
        query_attrs = attributes(query)
        numbers = {t for t in query_tokens if t.isdigit()}
        features = []
        for row in rows:
            row = int(row)
            title, category, body = self._fields(row)
            values = [float(lexical[row]), float(semantic[row]),
                      len(query_tokens & title) / length,
                      len(query_tokens & category) / length,
                      len(query_tokens & body) / length,
                      float(normalize(query) in normalize(self.products[row]['name'])),
                      len(query_tokens & title) / max(len(title), 1),
                      float(length), float(len(title))]
            for group in ('color', 'material', 'style', 'size', 'setting'):
                requested = set(query_attrs.get(group, []))
                available = body.intersection(ATTRIBUTE_TOKENS[group])
                values.append(len(requested & available) / max(len(requested), 1))
                if group in ('color', 'material'):
                    values.append(float(bool(requested and available and not requested.intersection(available))))
            values += [len(numbers & body) / max(len(numbers), 1), float(fused[row])]
            features.append(values)
        return np.array(features, dtype=np.float32).reshape(-1, len(FEATURE_NAMES))
