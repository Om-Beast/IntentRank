from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_input_validation():
    for params in ({'q': ''}, {'q': '  '}, {'q': 'x' * 161}, {'q': 'chair', 'mode': 'invalid'}, {'q': 'chair', 'limit': 1000}):
        assert client.get('/api/search', params=params).status_code == 422


def test_openapi_exposes_bounded_search_contract():
    spec = client.get('/openapi.json').json()
    assert '/api/search' in spec['paths']
    assert '/api/evaluation' in spec['paths']
