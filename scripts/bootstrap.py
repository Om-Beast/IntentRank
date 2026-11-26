"""Build the runtime, optionally retrain; never train while serving requests."""
from pathlib import Path
import argparse
import csv
import hashlib
import json
import os
import subprocess
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
from scripts.download import main as download
from scripts.prepare import main as prepare
from intentrank.ranker import TreeRanker
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--train', action='store_true', help='Fit on train queries, select on validation, evaluate once on test')
    args = parser.parse_args()
    download()
    prepare()
    if args.train:
        subprocess.run([sys.executable, '-u', 'scripts/train.py'], cwd=ROOT, check=True)
        subprocess.run([sys.executable, '-u', 'scripts/evaluate.py'], cwd=ROOT, check=True)
    out = ROOT / 'artifacts'
    for filename in ('ranker.json', 'training.json', 'evaluation.json', 'splits.json', 'parity.json'):
        if not (out / filename).exists():
            raise RuntimeError(f'Missing {filename}. Run bootstrap.py --train, or use a checkout with the trained model committed.')
    with (ROOT / 'data/query.csv').open(encoding='utf-8', newline='') as f:
        queries = [row['query'] for row in csv.DictReader(f, delimiter='\t')]
    (out / 'suggestions.json').write_text(json.dumps(queries))
    fixture = json.loads((out / 'parity.json').read_text())
    model = TreeRanker(json.loads((out / 'ranker.json').read_text()))
    np.testing.assert_allclose(model.predict(np.array(fixture['features'])), fixture['scores'], rtol=1e-5, atol=1e-6)
    hashes = {}
    for file in sorted(out.rglob('*')):
        if file.is_file() and file.name not in ('manifest.json', '.gitkeep'):
            hashes[str(file.relative_to(out))] = hashlib.sha256(file.read_bytes()).hexdigest()
    (out / 'manifest.json').write_text(json.dumps({'schema_version': 1, 'sha256': hashes}, indent=2))
    print('Runtime artifacts ready. Exported model parity verified.', flush=True)


if __name__ == '__main__':
    main()
