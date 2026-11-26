"""Train LambdaMART on train-query judgments; choose tree count on validation only."""
from pathlib import Path
import gzip
import json
import os
import sys
import time
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import numpy as np
import pandas as pd
import lightgbm as lgb
from intentrank.encoder import Encoder, MODEL_ID, MODEL_REVISION
from intentrank.features import FeatureExtractor, FEATURE_NAMES
from intentrank.retrieval import BM25, reciprocal_rank_fusion
from intentrank.splitting import split_queries
from scripts.download import WANDS_REVISION

ROOT = Path(__file__).resolve().parents[1]
GRADES = {'Irrelevant': 0, 'Partial': 1, 'Exact': 2}


def main():
    started = time.perf_counter()
    out = ROOT / 'artifacts'
    with gzip.open(out / 'catalogue.json.gz', 'rt') as f:
        products = json.load(f)
    row_for_id = {p['id']: row for row, p in enumerate(products)}
    queries = pd.read_csv(ROOT / 'data/query.csv', sep='\t').to_dict('records')
    labels = pd.read_csv(ROOT / 'data/label.csv', sep='\t')
    labels['grade'] = labels['label'].map(GRADES)
    if labels['grade'].isna().any():
        raise ValueError('Unexpected relevance grade')
    splits = split_queries(queries)
    (out / 'splits.json').write_text(json.dumps(splits, indent=2))
    vectors = np.load(out / 'embeddings.npy', mmap_mode='r')
    encoder = Encoder(out / 'encoder')
    query_vectors = encoder.encode([q['query'] for q in queries])
    np.save(out / 'query_embeddings.npy', query_vectors)
    lexical = BM25.load(out)
    extractor = FeatureExtractor(products)
    rows, grades, counts = {}, {}, {}
    for partition in ('train', 'validation'):
        xs, ys, groups = [], [], []
        for i, q in enumerate(queries):
            if q['query_id'] not in splits[partition]:
                continue
            judgments = labels[labels.query_id == q['query_id']].sort_values('product_id')
            selected = np.array([row_for_id[int(p)] for p in judgments.product_id])
            bm25 = lexical.score(q['query'])
            cosine = vectors @ query_vectors[i]
            _, fused = reciprocal_rank_fusion(bm25, cosine)
            xs.append(extractor.transform(q['query'], selected, bm25, cosine, fused))
            ys.extend(judgments.grade.tolist())
            groups.append(len(judgments))
        rows[partition], grades[partition], counts[partition] = np.vstack(xs), np.array(ys), groups
    model = lgb.LGBMRanker(objective='lambdarank', metric='ndcg', ndcg_eval_at=[10],
                           n_estimators=240, learning_rate=0.04, num_leaves=15,
                           min_child_samples=60, reg_lambda=2.0, max_depth=5,
                           random_state=42, n_jobs=2, verbosity=-1,
                           deterministic=True, force_col_wise=True, label_gain=[0, 1, 3])
    model.fit(rows['train'], grades['train'], group=counts['train'],
              eval_set=[(rows['validation'], grades['validation'])],
              eval_group=[counts['validation']], eval_at=[10],
              feature_name=FEATURE_NAMES,
              callbacks=[lgb.early_stopping(25, verbose=True), lgb.log_evaluation(25)])
    dumped = model.booster_.dump_model()
    (out / 'ranker.json').write_text(json.dumps(dumped, separators=(',', ':')))
    # Preserve a small parity fixture for portable inference and deployment checks.
    fixture_x = rows['validation'][:64]
    (out / 'parity.json').write_text(json.dumps({'features': fixture_x.tolist(), 'scores': model.predict(fixture_x).tolist()}))
    metadata = {'seed': 42, 'dataset_revision': WANDS_REVISION, 'encoder': MODEL_ID,
                'encoder_revision': MODEL_REVISION, 'encoder_fine_tuned': False,
                'product_count': len(products), 'query_count': len(queries), 'label_count': len(labels),
                'split_counts': {k: len(v) for k, v in splits.items()},
                'training_pairs': len(grades['train']), 'validation_pairs': len(grades['validation']),
                'trees': model.best_iteration_, 'features': FEATURE_NAMES,
                'feature_importance': dict(zip(FEATURE_NAMES, model.booster_.feature_importance(importance_type='gain').tolist())),
                'training_seconds': round(time.perf_counter() - started, 2),
                'gain': GRADES, 'candidate_pool': 'union of top 100 BM25 and top 100 dense candidates',
                'split_policy': 'near-duplicate query components (token Jaccard >= .75 or normalized string similarity >= .88), seed 42; 70/15/15 target'}
    (out / 'training.json').write_text(json.dumps(metadata, indent=2))
    print(json.dumps(metadata, indent=2))


if __name__ == '__main__':
    main()
