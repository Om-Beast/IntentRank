import json
from pathlib import Path
import numpy as np
import pytest
from intentrank.text import attributes, tokens
from intentrank.retrieval import BM25, top_k, reciprocal_rank_fusion
from intentrank.metrics import ndcg, bootstrap_interval
from intentrank.splitting import split_queries
from intentrank.ranker import TreeRanker
from intentrank.features import FeatureExtractor, FEATURE_NAMES


def test_bm25_matches_hand_calculation_and_roundtrips(tmp_path):
    index = BM25.build(['chair chair blue', 'chair red'])
    expected = np.log(1 + .5 / 2.5) * 2 * 2.2 / (2 + 1.2 * (.25 + .75 * 3 / 2.5))
    assert index.score('chair')[0] == pytest.approx(expected)
    assert not index.score('unknown').any()
    index.save(tmp_path)
    np.testing.assert_array_equal(index.score('blue chair'), BM25.load(tmp_path).score('blue chair'))


def test_tie_order_and_hybrid_union():
    assert top_k(np.array([1., 2., 2.]), 3).tolist() == [1, 2, 0]
    rows, fused = reciprocal_rank_fusion(np.array([2., 1., 0.]), np.array([0., 1., 2.]), 1)
    assert rows.tolist() == [0, 2]
    assert fused[0] == fused[2]
    assert fused[1] == 0


def test_query_constraints_are_preserved():
    assert attributes('Small GREY wooden table')['color'] == ['gray']
    assert 'not' in tokens('not black 18x18 chair')
    assert {'black', '18x18'} <= set(tokens('not black 18x18 chair'))


def test_ndcg_uses_full_ideal_pool_and_exponential_gains():
    assert ndcg([2, 1, 0], [0, 1, 2]) == pytest.approx(1)
    assert ndcg([0, 0], [2, 2]) == 0
    assert ndcg([1], [2]) == pytest.approx(1 / 3)
    assert bootstrap_interval([1, 1, 1]) == [1., 1.]


def test_near_duplicates_share_split_and_queries_are_disjoint():
    queries = [{'query_id': i, 'query': s} for i, s in enumerate(['wood coffee tables', 'wood coffee table', 'red chair', 'blue sofa', 'bath mat', 'desk lamp', 'bed', 'mirror', 'cabinet', 'sink'])]
    splits = split_queries(queries)
    flattened = [i for part in splits.values() for i in part]
    assert sorted(flattened) == list(range(10))
    assert len(flattened) == len(set(flattened))
    assert next(k for k, v in splits.items() if 0 in v) == next(k for k, v in splits.items() if 1 in v)
    assert split_queries(queries) == splits


def test_feature_schema_does_not_use_labels_or_query_class():
    product = {'name': 'black metal chair', 'category': 'chairs', 'description': '', 'features': 'color: black'}
    features = FeatureExtractor([product]).transform('white wood chair', np.array([0]), np.array([1]), np.array([.5]), np.array([.01]))
    assert features.shape == (1, len(FEATURE_NAMES))
    values = dict(zip(FEATURE_NAMES, features[0]))
    assert values['color_conflict'] == 1
    assert values['material_conflict'] == 1
    assert np.isfinite(features).all()


def test_exported_tree_predictions_match_lightgbm_fixture():
    root = Path(__file__).resolve().parents[1] / 'artifacts'
    if not (root / 'ranker.json').exists():
        pytest.skip('Run training to create the ranker parity fixture')
    model = TreeRanker(json.loads((root / 'ranker.json').read_text()))
    fixture = json.loads((root / 'parity.json').read_text())
    np.testing.assert_allclose(model.predict(np.array(fixture['features'])), fixture['scores'], rtol=1e-5, atol=1e-6)


def test_encoder_pooling_ignores_nonzero_padded_states():
    from types import SimpleNamespace
    from intentrank.encoder import Encoder

    # This known-answer fixture catches unmasked pooling even if padding has
    # large, nonzero hidden states. The expected normalized mean is [3, 4]/5.
    class TokenizerFixture:
        def encode_batch(self, texts):
            return [SimpleNamespace(ids=[1, 2, 0], attention_mask=[1, 1, 0], type_ids=[0, 0, 0])]

    class SessionFixture:
        def run(self, output_names, feeds):
            return [np.array([[[2., 2.], [4., 6.], [1000., 1000.]]], dtype=np.float32)]

    encoder = Encoder.__new__(Encoder)
    encoder.tokenizer = TokenizerFixture()
    encoder.session = SessionFixture()
    encoder.inputs = {'input_ids', 'attention_mask', 'token_type_ids'}
    np.testing.assert_allclose(encoder.encode(['fixture']), [[.6, .8]], atol=1e-6)


def test_duplicate_judgments_do_not_weight_pairs_or_invent_consensus():
    from intentrank.judgments import canonicalize
    rows = [
        {'query_id': 1, 'product_id': 1, 'label': 'Exact'},
        {'query_id': 1, 'product_id': 1, 'label': 'Exact'},
        {'query_id': 1, 'product_id': 2, 'label': 'Partial'},
        {'query_id': 1, 'product_id': 2, 'label': 'Exact'},
        {'query_id': 2, 'product_id': 1, 'label': 'Irrelevant'},
    ]
    clean, report = canonicalize(rows)
    assert [(r['query_id'], r['product_id'], r['grade']) for r in clean] == [(1, 1, 2), (2, 1, 0)]
    assert report['duplicate_extra_rows'] == 2
    assert report['conflicting_pairs_excluded'] == 1
    assert canonicalize(list(reversed(rows))) == (clean, report)
    with pytest.raises(ValueError, match='Unknown relevance'):
        canonicalize([{'query_id': 1, 'product_id': 1, 'label': 'invented'}])
