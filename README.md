# IntentRank

**Search, understood.** An interactive, reproducible e-commerce relevance lab built on Wayfair's real WANDS dataset.

Compare keyword search, frozen transformer retrieval, hybrid rank fusion, and a trained LambdaMART reranker across **42,994 products**. Inspect what changed, read the text evidence, and check the evaluation behind each claim.

> Independent project by [Om Kesharwani](https://github.com/Om-Beast). Not affiliated with Wayfair. No API keys required.

## What is actually implemented

- BM25 inverted index with deterministic ties and exact cosine retrieval using a pinned quantized MiniLM encoder.
- A supervised LightGBM LambdaMART model trained on **173,876** human-judged training pairs. The encoder is frozen; it is not presented as a fine-tuned model.
- Eighteen label-free query/product features shared across training, evaluation, and serving, including coverage and attribute evidence.
- Near-duplicate query grouping, explicit train/validation/test IDs, validation-only early stopping, bootstrap confidence intervals, and all per-query test results.
- A responsive React/TypeScript search lab with four ranking modes, side-by-side comparison, real product evidence, category filtering, JSON exports, and an evaluation dashboard.
- FastAPI with bounded inputs, local ONNX inference, immutable build artifacts, Docker packaging, and GitHub Actions checks.

## Results

A 336/72/72 query split is grouped before assignment. Products are shared across partitions, so this measures new-query generalization, not unseen products or temporal drift.

| Approach | Judged-pool NDCG@10 | Full-catalogue NDCG@10* |
| --- | ---: | ---: |
| BM25 | 0.7787 | 0.6689 |
| Frozen MiniLM | 0.7690 | 0.6851 |
| Hybrid RRF | 0.7961 | **0.7275** |
| Trained LambdaMART | **0.7995** | 0.6910 |

*Unjudged retrieved products get zero gain in full-catalogue NDCG. Read this alongside judgment coverage.*

The learned reranker is 2.7% higher than BM25 on judged-pool NDCG, but its paired 95% bootstrap interval crosses zero. Hybrid RRF leads full-catalogue NDCG in this experiment. This project preserves both findings rather than claiming every added model is an improvement. [Full results and error analysis](docs/RESULTS.md).

The local CPU run measured 41 ms p50 / 56 ms p95 over 72 uncached queries, excluding model startup and network. These are local engine measurements, not production SLAs.

## Reproduce the experiment

Use Python 3.12 and Node 24. A first build downloads roughly 150 MB of public inputs and generates the full-catalogue embeddings. Allow several minutes on a modern CPU and a few GB of free disk. No GPU is required.

```bash
git clone https://github.com/Om-Beast/IntentRank.git
cd IntentRank
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
python scripts/bootstrap.py --train
npm ci
npm run build
python -m pytest -q
uvicorn app:app --host 0.0.0.0 --port 8000
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1`. Open `http://localhost:8000` after starting the server. API documentation is at `/docs`.

To serve the committed model without retraining, install `requirements.txt` and run `python scripts/bootstrap.py` without `--train`. Training libraries are deliberately separate from runtime dependencies. The model, splits, parity fixture, and evaluation are committed. Raw data, encoder weights, postings, and embeddings are rebuilt from pinned public sources and are not committed.

For UI development, run the API on port 8000 and `npm run dev:ui` in another terminal. Vite proxies `/api` to the local backend. `npm run dev` serves the already-built UI and API together.

## API

```bash
curl 'http://localhost:8000/api/search?q=turquoise%20pillows&mode=learned&limit=10'
curl 'http://localhost:8000/api/evaluation'
curl 'http://localhost:8000/api/health'
```

Search modes are `bm25`, `semantic`, `hybrid`, and `learned`. Query length is capped at 160 characters and result count at 30. Category filtering is exact-match filtering and, in hybrid/learned mode, operates on the retrieved candidate pool. Ranking scores are not probabilities.

## Code map

| Location | Responsibility |
| --- | --- |
| `intentrank/text.py` | Shared normalization, tokenization, and attribute rules |
| `intentrank/encoder.py` | Quantized ONNX inference, masked pooling, normalization |
| `intentrank/retrieval.py` | BM25 postings, stable top-k, reciprocal rank fusion |
| `intentrank/features.py` | Identical training and serving feature extraction |
| `intentrank/ranker.py` | Small exported-tree predictor with LightGBM parity |
| `intentrank/engine.py` | Inference pipeline and product evidence |
| `scripts/` | Pinned downloads, preparation, splitting, training, evaluation |
| `artifacts/` | Trained model, query splits, parity fixture, measured report |
| `frontend/src/` | React search workspace, evaluation, and model views |
| `tests/` | Ranking math, split isolation, feature contract, prediction parity, API bounds |

[Architecture and tradeoffs](docs/ARCHITECTURE.md) · [Model card](docs/MODEL_CARD.md) · [Results](docs/RESULTS.md)

## Deployment

The Dockerfile builds the UI and CPU search artifacts before starting one non-root API worker. No training takes place during requests.

```bash
docker build -t intentrank .
docker run --rm -p 10000:10000 intentrank
```

The repository also includes Vercel FastAPI configuration. `python scripts/bootstrap.py` must complete during deployment before serving. A free host can have cold starts and resource limits. This is a portfolio workload, not a throughput benchmark.

## Data, licenses, and limitations

WANDS contains product text and human relevance judgments, not product images, prices, transactions, or conversion data. UI category illustrations are original schematic drawings and are explicitly labeled. Search results must not be treated as current inventory or purchase recommendations.

WANDS uses the MIT license. The MiniLM model and quantized ONNX export use Apache 2.0. Source code uses MIT. See [NOTICE](NOTICE) and [license notices](docs/licenses). Revisions are pinned and SHA-256 artifact manifests are generated during bootstrap.

Only 480 queries are available, annotations are incomplete outside judged pools, and heuristic grouping can miss paraphrases. Explicit sizes, negation, and multi-variant attributes remain difficult. No online A/B test, personalization, or business growth impact is claimed.
