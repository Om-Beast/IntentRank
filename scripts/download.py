"""Download immutable public inputs. All source revisions are pinned."""
from pathlib import Path
import sys
import urllib.request
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from intentrank.encoder import MODEL_ID, MODEL_REVISION

ROOT = Path(__file__).resolve().parents[1]
WANDS_REVISION = '3b74dcf4ba29ab8ff3e6a50b5b09fc627cb882b5'


def download(url: str, destination: Path):
    if destination.exists():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + '.part')
    print('Downloading', destination.relative_to(ROOT), flush=True)
    urllib.request.urlretrieve(url, temporary)
    temporary.replace(destination)


def main():
    for name in ('product.csv', 'query.csv', 'label.csv'):
        download(f'https://raw.githubusercontent.com/wayfair/WANDS/{WANDS_REVISION}/dataset/{name}', ROOT / 'data' / name)
    for source, name in [('tokenizer.json', 'tokenizer.json'), ('onnx/model_quantized.onnx', 'model_quantized.onnx')]:
        download(f'https://huggingface.co/{MODEL_ID}/resolve/{MODEL_REVISION}/{source}', ROOT / 'artifacts' / 'encoder' / name)


if __name__ == '__main__':
    main()
