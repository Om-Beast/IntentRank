"""Locked test-set evaluation. No fitting, hyperparameter search, or label features."""
from pathlib import Path
import json
import os
import sys
import time
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import numpy as np
import pandas as pd
from intentrank.engine import SearchEngine
from intentrank.metrics import ndcg, bootstrap_interval
from intentrank.retrieval import top_k
from scripts.train import GRADES

ROOT = Path(__file__).resolve().parents[1]
MODES = ('bm25', 'semantic', 'hybrid', 'learned')


def main():
    out = ROOT / 'artifacts'
    engine = SearchEngine(out)
    metadata = json.loads((out / 'training.json').read_text())
    splits = json.loads((out / 'splits.json').read_text())
    queries = pd.read_csv(ROOT / 'data/query.csv', sep='\t').to_dict('records')
    labels = pd.read_csv(ROOT / 'data/label.csv', sep='\t')
    row_for_id = {p['id']: i for i, p in enumerate(engine.products)}
    records, latency = [], []
    for query in queries:
        if query['query_id'] not in splits['test']:
            continue
        started = time.perf_counter()
        text = query['query']
        lexical, semantic, candidates, fused = engine.retrieve(text)
        features = engine.extractor.transform(text, candidates, lexical, semantic, fused)
        learned_scores = engine.ranker.predict(features)
        learned_rows = candidates[top_k(learned_scores, len(candidates))]
        latency.append((time.perf_counter() - started) * 1000)
        judgments = labels[labels.query_id == query['query_id']].sort_values('product_id')
        judged_rows = np.array([row_for_id[int(p)] for p in judgments.product_id])
        grades = np.array([GRADES[g] for g in judgments.label])
        grade_by_row = dict(zip(judged_rows.tolist(), grades.tolist()))
        relevant = {r for r, grade in grade_by_row.items() if grade > 0}
        judged_features = engine.extractor.transform(text, judged_rows, lexical, semantic, fused)
        judged_scores = engine.ranker.predict(judged_features)
        full_rankings = {'bm25': top_k(lexical, 100), 'semantic': top_k(semantic, 100),
                         'hybrid': candidates[top_k(fused[candidates], len(candidates))], 'learned': learned_rows}
        pool_scores = {'bm25': lexical[judged_rows], 'semantic': semantic[judged_rows],
                       'hybrid': fused[judged_rows], 'learned': judged_scores}
        modes = {}
        for mode in MODES:
            ranking = full_rankings[mode]
            first = ranking[:10]
            relevance = [grade_by_row.get(int(row), 0) for row in first]
            pool_order = top_k(pool_scores[mode], len(judged_rows))
            modes[mode] = {'catalogue_ndcg10': ndcg(relevance, grades),
                           'judged_pool_ndcg10': ndcg(grades[pool_order], grades),
                           'judged_at10': sum(int(row) in grade_by_row for row in first) / max(len(first), 1),
                           'recall100': len(set(ranking[:100]) & relevant) / max(len(relevant), 1)}
        records.append({'id': int(query['query_id']), 'query': text, 'judgments': len(grades),
                        'relevant': len(relevant), 'candidate_recall': len(set(candidates) & relevant) / max(len(relevant), 1),
                        'metrics': modes})
    summary = {}
    for mode in MODES:
        summary[mode] = {}
        for metric in ('catalogue_ndcg10', 'judged_pool_ndcg10', 'judged_at10', 'recall100'):
            values = [row['metrics'][mode][metric] for row in records]
            summary[mode][metric] = {'mean': float(np.mean(values)), 'ci95': bootstrap_interval(values)}
    differences = [r['metrics']['learned']['judged_pool_ndcg10'] - r['metrics']['bm25']['judged_pool_ndcg10'] for r in records]
    result = {'test_queries': len(records), 'models': summary, 'queries': records,
              'paired_delta_ci95': bootstrap_interval(differences),
              'candidate_recall': float(np.mean([r['candidate_recall'] for r in records])),
              'latency': {'p50_ms': float(np.percentile(latency, 50)), 'p95_ms': float(np.percentile(latency, 95)),
                          'environment': 'Local Linux CPU, ONNX Runtime, 2 inference threads. Includes uncached query encoding; excludes process/model startup and network.',
                          'samples': len(latency)},
              'protocol': {'primary': 'NDCG@10 over all human-judged products for each held-out query (judged-pool reranking).',
                           'catalogue': 'Full 42,994-product retrieval. Unjudged results receive zero gain, which can penalize genuinely relevant unjudged products. Interpret together with judged@10.',
                           'recall': 'Recall@100 uses known Exact or Partial labels as positives. Candidate recall uses the union of two top-100 lists.',
                           'uncertainty': 'Percentile bootstrap over held-out queries, 2,000 resamples, seed 42. Paired delta uses the same query pairs.',
                           'selection': 'Only validation NDCG@10 selected the tree count. Test labels were read only by this evaluation script.',
                           'caveats': ['Offline relevance does not establish conversion, revenue, or online A/B impact.', 'Only 480 source queries; some near-duplicate paraphrases may remain.', 'Products are shared across splits. The benchmark measures new-query generalization, not new-product or temporal generalization.', 'The encoder is pretrained and frozen; only the LambdaMART reranker is trained here.', 'Hybrid RRF is a candidate-generation baseline; its judged-pool ordering has many zero-score ties.']},
              'training': metadata}
    (out / 'evaluation.json').write_text(json.dumps(result, indent=2))
    print(json.dumps({'test_queries': len(records), 'models': summary, 'latency': result['latency'], 'paired_delta_ci95': result['paired_delta_ci95']}, indent=2))


if __name__ == '__main__':
    main()
