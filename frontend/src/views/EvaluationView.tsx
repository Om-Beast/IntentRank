import { ArrowRight, ArrowUpRight, BarChart3, BookOpen, CircleHelp, Download } from 'lucide-react';
import { modes, percent } from '../config';
import type { Evaluation, Mode } from '../types';
export function EvaluationView({
  evaluation,
  improvement,
  metric,
  setMetric,
  runSearch,
}: {
  evaluation: Evaluation | null;
  improvement: number | null;
  metric: string;
  setMetric: (metric: string) => void;
  runSearch: (query: string) => Promise<void>;
}) {
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">THE EVIDENCE</div>
        <h1>
          Measure what <em>matters.</em>
        </h1>
        <p>Real judgments, held-out queries, and the uncertainty behind the numbers.</p>
      </div>
      {!evaluation ? (
        <div className="loading-state">
          <BarChart3 size={28} />
          <p>Evaluation report is loading or unavailable.</p>
          <button onClick={() => location.reload()}>Reload report</button>
        </div>
      ) : (
        <>
          <div className="metric-cards">
            <div>
              <span>PRIMARY METRIC</span>
              <strong>{evaluation.models.learned.judged_pool_ndcg10.mean.toFixed(3)}</strong>
              <p>Judged-pool NDCG@10</p>
              <small>
                95% CI{' '}
                {evaluation.models.learned.judged_pool_ndcg10.ci95
                  .map((v) => v.toFixed(3))
                  .join(' – ')}
              </small>
            </div>
            <div>
              <span>VERSUS KEYWORD BASELINE</span>
              <strong>
                {improvement !== null && improvement >= 0 ? '+' : ''}
                {improvement?.toFixed(1)}
                <em>%</em>
              </strong>
              <p>Relative NDCG improvement</p>
              <small>
                Paired Δ 95% CI {evaluation.paired_delta_ci95.map((v) => v.toFixed(3)).join(' – ')}
              </small>
            </div>
            <div>
              <span>HELD-OUT TEST QUERIES</span>
              <strong>{evaluation.test_queries}</strong>
              <p>Never used for model fitting</p>
              <small>
                {evaluation.training.split_counts.train} train ·{' '}
                {evaluation.training.split_counts.validation} validation
              </small>
            </div>
          </div>
          <div className="statistical-note">
            <strong>Read the tradeoff.</strong> The learned model’s paired improvement over BM25 is
            not statistically conclusive at 95% on these 72 queries. Hybrid RRF leads the separate
            full-catalogue NDCG@10 evaluation. A stronger reranker is an experiment, not a
            guaranteed win.
          </div>
          <section className="panel benchmark">
            <div className="panel-heading">
              <div>
                <h2>The same queries. Four approaches.</h2>
                <p>Macro-average over the locked test split.</p>
              </div>
              <select
                aria-label="Choose evaluation metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <option value="judged_pool_ndcg10">Judged-pool NDCG@10</option>
                <option value="catalogue_ndcg10">Full-catalogue NDCG@10*</option>
                <option value="recall100">Known-positive Recall@100</option>
                <option value="judged_at10">Judgment coverage @10</option>
              </select>
            </div>
            <div className="bar-chart">
              {(Object.keys(modes) as Mode[]).map((m) => {
                const value = evaluation.models[m][metric];
                return (
                  <div className={`bar-row ${m === 'learned' ? 'highlight' : ''}`} key={m}>
                    <span>{modes[m]}</span>
                    <div className="bar-track">
                      <div style={{ width: `${value.mean * 100}%` }} />
                      <span
                        className="ci-mark"
                        style={{
                          left: `${value.ci95[0] * 100}%`,
                          width: `${(value.ci95[1] - value.ci95[0]) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{value.mean.toFixed(3)}</strong>
                  </div>
                );
              })}
              <div className="chart-axis">
                <span>0.00</span>
                <span>0.25</span>
                <span>0.50</span>
                <span>0.75</span>
                <span>1.00</span>
              </div>
            </div>
            <div className="chart-note">
              <CircleHelp size={15} />
              <p>
                {metric === 'judged_pool_ndcg10'
                  ? evaluation.protocol.primary
                  : metric === 'catalogue_ndcg10'
                    ? evaluation.protocol.catalogue
                    : metric === 'recall100'
                      ? evaluation.protocol.recall
                      : 'Fraction of the top ten returned products with an existing WANDS judgment. Unjudged does not mean irrelevant.'}{' '}
                Whiskers show query-bootstrap 95% intervals.
              </p>
            </div>
          </section>
          <div className="two-panels">
            <section className="panel">
              <span className="eyebrow light">PERFORMANCE ENVELOPE</span>
              <h2>Local CPU latency.</h2>
              <div className="latency-numbers">
                <div>
                  <strong>
                    {evaluation.latency.p50_ms.toFixed(0)}
                    <small> ms</small>
                  </strong>
                  <span>p50 · uncached queries</span>
                </div>
                <div>
                  <strong>
                    {evaluation.latency.p95_ms.toFixed(0)}
                    <small> ms</small>
                  </strong>
                  <span>p95 · uncached queries</span>
                </div>
              </div>
              <p className="small-prose">{evaluation.latency.environment}</p>
            </section>
            <section className="panel">
              <span className="eyebrow light">CANDIDATE GENERATION</span>
              <h2>Find first. Rank second.</h2>
              <div className="candidate-flow">
                <span>
                  BM25<small>top 100</small>
                </span>
                <span>+</span>
                <span>
                  MiniLM<small>top 100</small>
                </span>
                <ArrowRight size={16} />
                <span>
                  LambdaMART<small>rerank union</small>
                </span>
              </div>
              <p className="small-prose">
                {percent(evaluation.candidate_recall)} mean known-positive recall in the combined
                candidate pool. A reranker cannot recover products absent from that pool.
              </p>
            </section>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Look closer at individual queries.</h2>
                <p>All held-out queries, sorted by learned versus BM25 NDCG delta.</p>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(evaluation, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'intentrank-evaluation.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Full report <Download size={15} />
              </button>
            </div>
            <div className="query-table-wrap">
              <table className="query-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Judgments</th>
                    <th>BM25</th>
                    <th>IntentRank</th>
                    <th>Δ NDCG@10</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...evaluation.queries]
                    .sort(
                      (a, b) =>
                        b.metrics.learned.judged_pool_ndcg10 -
                        b.metrics.bm25.judged_pool_ndcg10 -
                        (a.metrics.learned.judged_pool_ndcg10 - a.metrics.bm25.judged_pool_ndcg10),
                    )
                    .map((q) => {
                      const delta =
                        q.metrics.learned.judged_pool_ndcg10 - q.metrics.bm25.judged_pool_ndcg10;
                      return (
                        <tr key={q.id}>
                          <td>{q.query}</td>
                          <td>{q.judgments}</td>
                          <td>{q.metrics.bm25.judged_pool_ndcg10.toFixed(3)}</td>
                          <td>{q.metrics.learned.judged_pool_ndcg10.toFixed(3)}</td>
                          <td className={delta >= 0 ? 'positive' : 'negative'}>
                            {delta >= 0 ? '+' : ''}
                            {delta.toFixed(3)}
                          </td>
                          <td>
                            <button
                              onClick={() => void runSearch(q.query)}
                              aria-label={`Search ${q.query}`}
                            >
                              <ArrowUpRight size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
          <section className="methodology">
            <BookOpen size={21} />
            <div>
              <h3>How to interpret this benchmark.</h3>
              <p>
                {evaluation.training.split_policy}. {evaluation.protocol.selection}{' '}
                {evaluation.protocol.uncertainty}
              </p>
              <ul>
                {evaluation.protocol.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  );
}
