"""Integration checks use the actual catalogue and ONNX model, not mock predictions."""
from pathlib import Path
import json
import csv
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app import app, get_engine

ROOT = Path(__file__).resolve().parents[1]
pytestmark = pytest.mark.skipif(not (ROOT / 'artifacts/embeddings.npy').exists(), reason='Build runtime artifacts for integration checks')


@pytest.fixture(scope='module')
def engine():
    return get_engine()


def test_real_encoder_returns_repeatable_unit_vectors(engine):
    vectors = engine.encoder.encode(['turquoise pillow', 'turquoise pillow'])
    assert vectors.shape == (2, 384)
    assert np.isfinite(vectors).all()
    np.testing.assert_allclose(np.linalg.norm(vectors, axis=1), 1, atol=1e-5)
    np.testing.assert_allclose(vectors[0], vectors[1], atol=1e-6)


def test_real_api_returns_finite_unique_results_and_exact_filtering(engine):
    client = TestClient(app)
    response = client.get('/api/search', params={'q': 'turquoise pillows', 'limit': 5, 'category': 'Accent Pillows'})
    assert response.status_code == 200
    data = response.json()
    assert data['catalogue_count'] == 42994
    assert len(data['results']) == 5
    assert len({r['id'] for r in data['results']}) == 5
    assert all(r['category'] == 'Accent Pillows' for r in data['results'])
    assert all(np.isfinite(r['score']) for r in data['results'])
    assert data['attributes']['color'] == ['turquoise']


def test_keyword_oov_has_no_positive_score_results(engine):
    result = engine.search('qzxjvzzqq', mode='bm25')
    assert result['results'] == []
    assert result['baseline'] == []


def test_committed_split_is_complete_and_mutually_exclusive():
    splits = json.loads((ROOT / 'artifacts/splits.json').read_text())
    ids = [q for values in splits.values() for q in values]
    assert len(ids) == len(set(ids)) == 480
    with (ROOT / 'data/query.csv').open(newline='', encoding='utf-8') as f:
        source_ids = {int(row['query_id']) for row in csv.DictReader(f, delimiter='\t')}
    assert set(ids) == source_ids
