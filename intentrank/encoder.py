"""A pinned, quantized MiniLM encoder. No remote inference or API keys."""
from __future__ import annotations

from pathlib import Path
import numpy as np
from tokenizers import Tokenizer
import onnxruntime as ort

MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
MODEL_REVISION = '751bff37182d3f1213fa05d7196b954e230abad9'
DIMENSION = 384


class Encoder:
    """Mean-pool token embeddings with the attention mask, then L2-normalize."""

    def __init__(self, directory: Path, threads: int = 2):
        self.tokenizer = Tokenizer.from_file(str(directory / 'tokenizer.json'))
        self.tokenizer.enable_truncation(max_length=128)
        self.tokenizer.enable_padding()
        options = ort.SessionOptions()
        options.intra_op_num_threads = threads
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(str(directory / 'model_quantized.onnx'),
                                            sess_options=options, providers=['CPUExecutionProvider'])
        self.inputs = {v.name for v in self.session.get_inputs()}

    def encode(self, texts: list[str], batch_size: int = 32) -> np.ndarray:
        if not texts:
            return np.empty((0, DIMENSION), dtype=np.float32)
        output = []
        for start in range(0, len(texts), batch_size):
            encoded = self.tokenizer.encode_batch(texts[start:start + batch_size])
            feeds = {'input_ids': np.asarray([e.ids for e in encoded], dtype=np.int64),
                     'attention_mask': np.asarray([e.attention_mask for e in encoded], dtype=np.int64),
                     'token_type_ids': np.asarray([e.type_ids for e in encoded], dtype=np.int64)}
            hidden = self.session.run(None, {k: v for k, v in feeds.items() if k in self.inputs})[0]
            mask = feeds['attention_mask'][..., None]
            pooled = (hidden * mask).sum(axis=1) / np.maximum(mask.sum(axis=1), 1)
            pooled /= np.maximum(np.linalg.norm(pooled, axis=1, keepdims=True), 1e-12)
            output.append(pooled.astype(np.float32))
        return np.concatenate(output)
