"""Download immutable public inputs. All source revisions are pinned."""
from pathlib import Path
import sys
import hashlib
import urllib.request
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from intentrank.encoder import MODEL_ID, MODEL_REVISION

ROOT = Path(__file__).resolve().parents[1]
WANDS_REVISION = '3b74dcf4ba29ab8ff3e6a50b5b09fc627cb882b5'
EXPECTED_SHA256 = {
    'product.csv': 'd993926254572e6eba96c8fd87cc549a17fb91ad3748308036eee4cf92b10ac6',
    'query.csv': '63b61660560fecc33ec490804c7e2b81402ee3e7c31a9cbb5e03736639f68e95',
    'label.csv': 'c11fe81ad62f17f56f316b0ec9630ebe8fbe1393578cb0ca4f05c17253a180ef',
    'tokenizer.json': 'da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0',
    'model_quantized.onnx': 'afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1',
}



def verify(path: Path, source_name: str | None = None):
    expected = EXPECTED_SHA256[source_name or path.name]
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != expected:
        raise ValueError(f'Source checksum mismatch for {source_name or path.name}')


def download(url: str, destination: Path):
    if destination.exists():
        verify(destination)
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + '.part')
    print('Downloading', destination.relative_to(ROOT), flush=True)
    urllib.request.urlretrieve(url, temporary)
    verify(temporary, destination.name)
    temporary.replace(destination)


def main():
    for name in ('product.csv', 'query.csv', 'label.csv'):
        download(f'https://raw.githubusercontent.com/wayfair/WANDS/{WANDS_REVISION}/dataset/{name}', ROOT / 'data' / name)
    for source, name in [('tokenizer.json', 'tokenizer.json'), ('onnx/model_quantized.onnx', 'model_quantized.onnx')]:
        download(f'https://huggingface.co/{MODEL_ID}/resolve/{MODEL_REVISION}/{source}', ROOT / 'artifacts' / 'encoder' / name)


if __name__ == '__main__':
    main()
