# Explaining IntentRank

## A concise introduction

“IntentRank is a product-search relevance lab built on Wayfair’s WANDS dataset. It searches a catalogue of about 43,000 products and compares BM25, a frozen MiniLM encoder, hybrid rank fusion, and a trained LambdaMART reranker. The main engineering decision was keeping the data split, features, inference, and evaluation consistent. The results also show why a more complex model is not automatically better.”

Use this only after you have reproduced the pipeline and can walk through the implementation yourself.

## A five-minute demo

1. Search `turquoise pillows`. Point out that the input includes both a product type and a color constraint. Open a product and show the exact text evidence. Evidence is not a verified specification.
2. Switch between BM25, MiniLM, Hybrid RRF, and IntentRank. Enable comparison to inspect rank changes. Explain that candidate retrieval comes before supervised reranking.
3. Search a query of your own, including a specific material or dimension. Discuss any poor matches directly instead of hiding them.
4. Open Evaluation. Change between judged-pool and full-catalogue NDCG@10. Explain why incomplete judgments change the interpretation.
5. Open Model card. Show that the encoder is frozen and the trained component is LambdaMART. Point to the source, exact splits, portable-tree parity test, and reproducible setup.

## Questions to be ready for

**What did you train?**

The LambdaMART reranker, using 172,769 annotated pairs from 336 training queries. The MiniLM encoder uses pretrained quantized weights. Seven trees were selected on 72 validation queries. Seventy-two other queries were held out for the reported test.

**Why split by query instead of label row?**

A random pair split can put products judged for the same query in both train and test. That makes the new-query evaluation optimistic. Near-duplicate query groups stay together here. Product identities can appear in all partitions because the intended setting is a fixed catalogue with new search queries.

**Why not use an LLM to rewrite everything?**

This project keeps the live path local, inexpensive, and reproducible. Normalization preserves explicit constraints. An LLM rewriting system would need a separate evaluation of attribute preservation, hallucinated constraints, and latency. That experiment is not implemented or claimed.

**What does NDCG measure?**

It rewards placing higher-relevance products near the top. Exact has gain 3, Partial 1, and Irrelevant 0. Logarithmic position discount makes a high-relevance item at rank 1 more valuable than the same item at rank 10. Scores are normalized against the ideal annotated ordering.

**What did you learn from the results?**

The learned model has the highest observed judged-pool NDCG@10 at 0.8034, compared with BM25’s 0.7801. Its paired 95% interval crosses zero, so the improvement is not statistically conclusive. Hybrid RRF leads the separate full-catalogue evaluation at 0.7275. The right conclusion is a tradeoff, not that the reranker always wins.

**What is the biggest remaining bottleneck?**

Candidate coverage. The union of top-100 BM25 and top-100 dense results recovers only 53.2% of known Exact/Partial products on average. Improving candidate retrieval can matter more than increasing reranker complexity.

**Why no vector database?**

With 42,994 normalized 384-dimensional vectors, exact NumPy retrieval is small and fast enough for this workload. It avoids a separate service and approximation error. Millions of products or a high query rate would change that tradeoff.

**How did you avoid train/serve drift?**

Both paths import the same text, feature, and retrieval modules. Production uses the exported tree model. A committed fixture compares portable predictions with LightGBM outputs. No relevance labels or human query classes enter the serving features.

**What did the feature importance show?**

The selected model mostly uses RRF and lexical coverage. Explicit attribute features receive zero training gain in the selected model. They remain useful evidence in the interface, but this experiment does not establish a ranking benefit from them.

**Did it improve sales?**

No online experiment was run. These are offline relevance results. Conversion, revenue, or commercial impact would require an online test and appropriate guardrails.

## Accurate resume bullets

- Built a reproducible product-search system over 42,994 WANDS products with BM25, quantized MiniLM retrieval, hybrid RRF, and a LambdaMART reranker trained on 172,769 human-judged pairs.
- Implemented query-grouped evaluation, bootstrap confidence intervals, portable model parity checks, and a FastAPI/React search lab; hybrid retrieval achieved 0.7275 full-catalogue NDCG@10 on 72 held-out queries under incomplete judgments.

If discussing performance, say “58 ms local CPU engine p95, excluding startup and network,” not “58 ms production latency.” Do not claim a fine-tuned transformer, a cross-encoder, an online A/B win, or a statistically significant gain.
