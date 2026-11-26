"""FastAPI entrypoint. Search is read-only and uses local model artifacts."""
from __future__ import annotations
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
os.environ.setdefault('OMP_NUM_THREADS', '2')
from functools import lru_cache
from pathlib import Path
import json
import logging
from threading import Lock
from typing import Literal
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from intentrank.engine import SearchEngine

ROOT = Path(__file__).resolve().parent
ARTIFACTS = ROOT / 'artifacts'
app = FastAPI(title='IntentRank Search API', version='1.0.0',
              description='WANDS product search with BM25, frozen MiniLM retrieval, and a trained LambdaMART reranker.')
_init_lock = Lock()


@lru_cache(maxsize=1)
def get_engine() -> SearchEngine:
    # lru_cache alone allows duplicate concurrent cache misses. Serialize construction.
    with _init_lock:
        return _load_engine()


@lru_cache(maxsize=1)
def _load_engine() -> SearchEngine:
    return SearchEngine(ARTIFACTS)


@app.get('/api/health')
def health():
    required = ['catalogue.json.gz', 'bm25.npz', 'embeddings.npy', 'ranker.json',
                'vocabulary.json', 'encoder/tokenizer.json', 'encoder/model_quantized.onnx']
    ready = all((ARTIFACTS / name).is_file() for name in required)
    if not ready:
        raise HTTPException(503, 'Search artifacts are not ready. Run the bootstrap script.')
    return {'status': 'ready', 'version': '1.0.0', 'model': 'minilm-lambdamart-v1'}


@app.get('/api/evaluation')
def evaluation(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=3600'
    path = ARTIFACTS / 'evaluation.json'
    if not path.exists():
        raise HTTPException(503, 'Evaluation report has not been generated.')
    return json.loads(path.read_text())


@app.get('/api/search')
def search(q: str = Query(min_length=1, max_length=160),
           mode: Literal['bm25', 'semantic', 'hybrid', 'learned'] = 'learned',
           limit: int = Query(default=10, ge=1, le=30),
           category: str | None = Query(default=None, max_length=100)):
    if not q.strip():
        raise HTTPException(422, 'Enter a search query.')
    try:
        return get_engine().search(q.strip(), mode, limit, category or None)
    except (FileNotFoundError, OSError):
        logging.exception('Search artifact initialization failed')
        raise HTTPException(503, 'Search is unavailable while model artifacts load. Please retry.') from None


@app.get('/api/suggestions')
def suggestions(q: str = Query(default='', max_length=160)):
    path = ARTIFACTS / 'suggestions.json'
    values = json.loads(path.read_text()) if path.exists() else []
    return {'suggestions': [s for s in values if q.casefold() in s.casefold()][:6]}


@app.get('/', include_in_schema=False)
def index():
    return FileResponse(ROOT / 'public/index.html')


# Vercel serves public/ from its CDN. Mount assets only for local/Docker serving.
if not os.environ.get('VERCEL') and (ROOT / 'public/assets').exists():
    app.mount('/assets', StaticFiles(directory=ROOT / 'public/assets'), name='assets')
