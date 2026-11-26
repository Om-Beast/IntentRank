"""Audit source identities and judgments before relying on a ranking benchmark."""
from pathlib import Path
import json
import hashlib
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pandas as pd
from intentrank.judgments import load_judgments

ROOT = Path(__file__).resolve().parents[1]


def main():
    checksums = json.loads((ROOT / 'docs/INPUT_CHECKSUMS.json').read_text())
    for name in ('product.csv', 'query.csv', 'label.csv'):
        actual = hashlib.sha256((ROOT / 'data' / name).read_bytes()).hexdigest()
        if actual != checksums[name]:
            raise ValueError(f'Pinned source checksum mismatch: {name}')
    products = pd.read_csv(ROOT / 'data/product.csv', sep='\t')
    queries = pd.read_csv(ROOT / 'data/query.csv', sep='\t')
    labels = pd.read_csv(ROOT / 'data/label.csv', sep='\t')
    splits = json.loads((ROOT / 'artifacts/splits.json').read_text())
    canonical, judgment_audit = load_judgments(ROOT / 'data/label.csv')
    duplicate_pairs = int(labels.duplicated(['query_id', 'product_id']).sum())
    bad_query_ids = sorted(set(labels.query_id) - set(queries.query_id))
    bad_product_ids = sorted(set(labels.product_id) - set(products.product_id))
    report = {
        'pinned_data_checksums_verified': True,
        'judgment_canonicalization': judgment_audit,
        'products': len(products), 'queries': len(queries), 'judgments': len(labels),
        'unique_product_ids': int(products.product_id.nunique()),
        'unique_query_ids': int(queries.query_id.nunique()),
        'duplicate_query_product_pairs': duplicate_pairs,
        'unknown_query_ids': bad_query_ids, 'unknown_product_ids': bad_product_ids,
        'labels': {k: int(v) for k, v in labels.label.value_counts().items()},
        'missing_product_classes': int(products.product_class.isna().sum()),
        'missing_product_descriptions': int(products.product_description.isna().sum()),
        'query_id_min': int(queries.query_id.min()), 'query_id_max': int(queries.query_id.max()),
        'note': 'Query IDs are source identifiers and are not assumed contiguous.',
        'canonical_split_pairs': {k: sum(row['query_id'] in set(ids) for row in canonical) for k, ids in {k: set(v) for k, v in splits.items()}.items()},
        'raw_split_judgments': {k: int(labels.query_id.isin(ids).sum()) for k, ids in splits.items()},
    }
    if bad_query_ids or bad_product_ids:
        raise ValueError(f'Identity audit failed: {report}')
    (ROOT / 'docs/DATA_AUDIT.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
