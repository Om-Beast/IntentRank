"""Read-only LightGBM tree inference without a training framework in the API image."""
from __future__ import annotations
import numpy as np


class TreeRanker:
    def __init__(self, model: dict):
        self.trees = [entry['tree_structure'] for entry in model['tree_info']]

    @staticmethod
    def _predict_tree(node: dict, row: np.ndarray) -> float:
        while 'leaf_value' not in node:
            # Exported features are finite, numeric, and have no missing values.
            goes_left = row[node['split_feature']] <= node['threshold']
            node = node['left_child'] if goes_left else node['right_child']
        return node['leaf_value']

    def predict(self, features: np.ndarray) -> np.ndarray:
        return np.array([sum(self._predict_tree(tree, row) for tree in self.trees)
                         for row in features], dtype=np.float32)
