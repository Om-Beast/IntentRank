"""Materialize the catalogue and retrieval artifacts independently of relevance labels."""
from pathlib import Path
import gzip
import csv
import json
import sys
import time
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import numpy as np
from intentrank.encoder import Encoder
from intentrank.retrieval import BM25

ROOT = Path(__file__).resolve().parents[1]


def main():
    out = ROOT / 'artifacts'
    with (ROOT / 'data/product.csv').open(encoding='utf-8', newline='') as f:
        data = list(csv.DictReader(f, delimiter='\t'))
    products = []
    for row in data:
        products.append({'id': int(row['product_id']), 'name': row['product_name'],
                         'category': row['product_class'], 'hierarchy': row['category hierarchy'],
                         'description': row['product_description'][:1800],
                         'features': row['product_features'][:4000],
                         'rating': float(row['average_rating'] or 0),
                         'reviews': int(float(row['review_count'] or 0))})
    with gzip.open(out / 'catalogue.json.gz', 'wt', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, separators=(',', ':'))
    documents = [f"{p['name']} {p['name']} {p['category']} {p['description']} {p['features']}" for p in products]
    if not (out / 'bm25.npz').exists():
        print('Building BM25', flush=True)
        BM25.build(documents).save(out)
    if not (out / 'embeddings.npy').exists():
        encoder = Encoder(out / 'encoder')
        # Place discriminative fields first; the encoder truncates at 128 tokens.
        texts = [f"{p['name']}. {p['category']}. {p['description'][:500]}" for p in products]
        vectors, started = [], time.perf_counter()
        for i in range(0, len(texts), 256):
            vectors.append(encoder.encode(texts[i:i + 256]))
            if i % 2048 == 0:
                print(f'Encoded {min(i + 256, len(texts))}/{len(texts)} products in {time.perf_counter()-started:.0f}s', flush=True)
        np.save(out / 'embeddings.npy', np.concatenate(vectors))
    with (ROOT / 'data/query.csv').open(encoding='utf-8', newline='') as f:
        suggestions = [q['query'] for q in csv.DictReader(f, delimiter='\t')]
    (out / 'suggestions.json').write_text(json.dumps(suggestions))
    print('Catalogue ready', len(products), flush=True)


if __name__ == '__main__':
    main()
