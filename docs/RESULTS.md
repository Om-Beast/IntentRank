# Locked test results

Duplicate identical judgments are collapsed, and all 14 conflicting query-product pairs are excluded. This leaves 231,859 canonical pairs from 233,448 raw rows. The aggregation rule was fixed as a data correctness repair and is shared by training and evaluation.

Source revisions and exact query IDs are committed alongside the model. The test set has 72 queries, with 336 training and 72 validation queries. The training set contains 172,769 query-product judgments. Seven boosting trees were selected by validation NDCG@10.

| Approach | Judged-pool NDCG@10 | Full-catalogue NDCG@10* | Known-positive Recall@100 | Judged@10 |
| --- | ---: | ---: | ---: | ---: |
| BM25 | 0.7801 | 0.6689 | 0.4251 | 0.8319 |
| Frozen MiniLM | 0.7706 | 0.6851 | 0.3711 | 0.8361 |
| Hybrid RRF | 0.7988 | **0.7275** | **0.4261** | **0.8806** |
| LambdaMART | **0.8034** | 0.6854 | 0.3736 | 0.8153 |

*Full-catalogue NDCG treats unjudged retrieved products as zero gain. This is an incomplete-judgment estimate, not proof those products are irrelevant.*

The reranker's observed judged-pool improvement over BM25 is 3.0% relative. The query-paired 95% bootstrap interval for the absolute NDCG delta is [-0.0033, 0.0505], which crosses zero. The experiment does not establish a statistically conclusive improvement at 95%.

Hybrid RRF has the best observed full-catalogue NDCG@10, an 8.8% relative improvement over BM25. It also has greater judgment coverage, which affects incomplete-judgment NDCG. The learned reranker is not uniformly superior. All four approaches remain available in the live lab so this tradeoff is visible.

The union of top-100 BM25 and top-100 dense retrieval has 53.2% average recall of known Exact/Partial products. There is meaningful retrieval headroom before experimenting with larger rerankers.

## Performance

The locked 72-query run measured 39 ms p50 and 58 ms p95 on the local Linux CPU using two ONNX inference threads. This includes uncached query encoding and ranking, excludes process/model startup and the network, and should not be presented as production latency.

## Error analysis

The committed query-level report includes improvements and regressions. Examples use judged-pool NDCG, not the full-catalogue result displayed in the search UI.

| Query | BM25 | LambdaMART | Observation |
| --- | ---: | ---: | --- |
| wainscoting ideas | 0.512 | 0.890 | Broader intent benefits from the combined features. |
| beds that have leds | 0.028 | 0.333 | Semantic intent helps, but substantial error remains. |
| king size bed | 0.710 | 1.000 | The reranker orders the annotated pool more effectively. |
| blk 18x18 seat cushions | 0.807 | 0.470 | Precise abbreviated and dimensional queries regress. |
| light and navy blue decorative pillow | 0.687 | 0.442 | Fine-grained color constraints remain difficult. |

The ranker's training split gain is dominated by RRF membership and text coverage. Explicit attribute features receive no gain in the selected seven-tree model. They are still inspected in evidence and tested as a feature contract, but this experiment does not show they improve ranking. Useful next experiments would be evaluated on validation first, with a new untouched test set or nested cross-validation before new headline claims.

Machine-readable values, confidence intervals, all held-out query results, and environment notes are in `artifacts/evaluation.json`. Do not substitute rounded README values for the raw report in a reproduction check.
