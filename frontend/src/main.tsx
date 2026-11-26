import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Database,
  Download,
  FlaskConical,
  GitBranch,
  Github,
  Layers3,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Furniture } from './components/Furniture';
import { Mark } from './components/Mark';
import { ProductCard } from './components/ProductCard';
import { REPO, examples, fmt, modes } from './config';
import './styles.css';
import type { Evaluation, Mode, Product, SearchResult } from './types';
import { EvaluationView } from './views/EvaluationView';
import { ModelView } from './views/ModelView';

function App() {
  const params = new URLSearchParams(location.search);
  const [page, setPage] = useState('search');
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);
  const [query, setQuery] = useState(params.get('q') || 'sofa with ottoman');
  const [mode, setMode] = useState<Mode>('learned');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compare, setCompare] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [metric, setMetric] = useState('judged_pool_ndcg10');
  const [category, setCategory] = useState('');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const detailClose = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetch('/api/evaluation', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw Error('Evaluation unavailable');
        return r.json();
      })
      .then(setEvaluation)
      .catch(() => {});
    return () => request.current?.abort();
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === '/' && !(e.target instanceof HTMLInputElement)) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'k')
      ) {
        e.preventDefault();
        setPage('search');
        input.current?.focus();
      }
      if (e.key === 'Escape') {
        setDetail(null);
        setFocused(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    if (detail) {
      previousFocus.current = document.activeElement as HTMLElement;
      detailClose.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [detail]);
  useEffect(() => {
    if (!focused || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(
      () =>
        fetch(`/api/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((d) => setSuggestions(d.suggestions || []))
          .catch(() => {}),
      200,
    );
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, focused]);

  async function runSearch(value = query, selected = mode, selectedCategory = category) {
    if (!value.trim()) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    setQuery(value);
    setFocused(false);
    setPage('search');
    const url = new URL(location.href);
    url.searchParams.set('q', value);
    history.replaceState({}, '', url);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(value)}&mode=${selected}&limit=12${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`,
        { signal: controller.signal },
      );
      if (!response.ok)
        throw Error(
          response.status === 503
            ? 'The search model is starting. Please try again in a moment.'
            : 'Search could not be completed. Please try again.',
        );
      const data: SearchResult = await response.json();
      if (!controller.signal.aborted) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    void runSearch();
  }, []);
  function chooseMode(value: Mode) {
    setMode(value);
    void runSearch(result?.query || query, value);
  }
  function exportResults() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intentrank-search.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  const improvement = evaluation
    ? (evaluation.models.learned.judged_pool_ndcg10.mean /
        evaluation.models.bm25.judged_pool_ndcg10.mean -
        1) *
      100
    : null;
  const categories = Array.from(
    new Set([...(result?.results || []), ...(result?.baseline || [])].map((p) => p.category)),
  ).sort();
  const showing = compare ? result?.results.slice(0, 6) : result?.results;

  return (
    <div className="app-shell">
      <aside className="sidebar" inert={Boolean(detail)}>
        <a className="brand" href="/" aria-label="IntentRank home">
          <Mark />
          <span>
            IntentRank<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">SEARCH WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button className={page === 'search' ? 'active' : ''} onClick={() => setPage('search')}>
            <Search size={18} />
            Search lab<span className="nav-key">/</span>
          </button>
          <button
            className={page === 'evaluation' ? 'active' : ''}
            onClick={() => setPage('evaluation')}
          >
            <BarChart3 size={18} />
            Evaluation
          </button>
          <button className={page === 'model' ? 'active' : ''} onClick={() => setPage('model')}>
            <Layers3 size={18} />
            Model card
          </button>
          <a href={`${REPO}#reproduce-the-experiment`} target="_blank" rel="noreferrer">
            <Code2 size={18} />
            Documentation
            <ArrowUpRight size={14} />
          </a>
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">THE DATASET</div>
        <a
          className="dataset-link"
          href="https://github.com/wayfair/WANDS"
          target="_blank"
          rel="noreferrer"
        >
          <span className="dataset-icon">
            <Database size={19} />
          </span>
          <span>
            <strong>Wayfair WANDS</strong>
            <small>Human-judged relevance</small>
          </span>
          <ArrowUpRight size={14} />
        </a>
        <div className="sidebar-note">
          <span className="note-star">✳</span>
          <h3>
            Good search starts
            <br />
            with understanding.
          </h3>
          <p>
            One query. Four approaches.
            <br />
            See what makes a result relevant.
          </p>
          <button onClick={() => setPage('model')}>
            Inside the model <ArrowRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <a href={REPO} target="_blank" rel="noreferrer">
            <Github size={17} />
            <span>View source code</span>
            <ArrowUpRight size={15} />
          </a>
          <div className="creator">
            <span className="avatar">OK</span>
            <span>
              Om Kesharwani<small>Independent ML project</small>
            </span>
            <span className="version">v1.0</span>
          </div>
        </div>
      </aside>
      <main inert={Boolean(detail)}>
        <header className="topbar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {page === 'search'
                ? 'Search lab'
                : page === 'evaluation'
                  ? 'Evaluation'
                  : 'Model card'}
            </strong>
          </div>
          <a href="https://github.com/wayfair/WANDS" target="_blank" rel="noreferrer">
            <span className="status-dot" /> REAL DATA · OPEN SOURCE <ArrowUpRight size={13} />
          </a>
        </header>
        <div className="main-content">
          {page === 'search' ? (
            <>
              <section className="hero">
                <div>
                  <div className="eyebrow">
                    <span /> SEARCH, UNDERSTOOD.
                  </div>
                  <h1>
                    A better result.
                    <br />
                    <em>A little more understanding.</em>
                  </h1>
                  <p>
                    Explore the difference between matching words
                    <br className="desktop-break" /> and understanding what someone is looking for.
                  </p>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="art-card art-card-back">
                    <Search size={24} />
                    <div className="art-line" />
                    <div className="art-line short" />
                  </div>
                  <div className="art-card art-card-front">
                    <Mark small />
                    <span>intent → relevance</span>
                    <div className="art-bars">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="art-card-footer">
                      <span>UNDERSTANDING, RANKED.</span>
                      <Sparkles size={14} />
                    </div>
                  </div>
                  <div className="art-star">✳</div>
                </div>
              </section>
              <section className="search-section" aria-label="Product search">
                <form
                  className="search-box"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runSearch();
                  }}
                >
                  <Search size={21} />
                  <input
                    ref={input}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                    placeholder="Try a product, material, or idea…"
                    aria-label="Search the product catalogue"
                    maxLength={160}
                  />
                  <kbd>⌘ K</kbd>
                  <button type="submit" disabled={loading || !query.trim()}>
                    {loading ? (
                      <LoaderCircle size={17} className="spin" />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                    <span>{loading ? 'Searching' : 'Explore'}</span>
                  </button>
                </form>
                {focused && suggestions.length > 0 && (
                  <div
                    className="suggestions"
                    role="region"
                    aria-label="Benchmark query suggestions"
                  >
                    {suggestions
                      .filter((s) => s !== query)
                      .map((s) => (
                        <button
                          key={s}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => void runSearch(s)}
                        >
                          <Search size={14} />
                          {s}
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                  </div>
                )}
                <div className="examples">
                  <span>Try a little inspiration</span>
                  {examples.map((x) => (
                    <button key={x} onClick={() => void runSearch(x)}>
                      {x}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
              </section>
              <section className="overview-strip" aria-label="Dataset and model summary">
                <div>
                  <Database size={16} />
                  <strong>{evaluation ? fmt(evaluation.training.product_count) : '42,994'}</strong>
                  <span>real products</span>
                </div>
                <div>
                  <CheckCheck size={16} />
                  <strong>{evaluation ? fmt(evaluation.training.label_count) : '233,448'}</strong>
                  <span>human judgments</span>
                </div>
                <div>
                  <GitBranch size={16} />
                  <strong>4</strong>
                  <span>ranking approaches</span>
                </div>
                <button onClick={() => setPage('evaluation')}>
                  {improvement !== null ? (
                    <>
                      <span className="mini-chart">↗</span>
                      <strong>
                        {improvement >= 0 ? '+' : ''}
                        {improvement.toFixed(1)}%
                      </strong>
                      <span>judged-pool NDCG@10</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 size={16} />
                      <span>Explore the benchmark</span>
                    </>
                  )}
                  <ArrowUpRight size={14} />
                </button>
              </section>
              <section className="results-section" aria-busy={loading}>
                <div className="section-heading">
                  <div>
                    <div className="eyebrow light">THE SEARCH LAB</div>
                    <h2>{compare ? 'Two rankings. One query.' : 'Relevance, in the details.'}</h2>
                  </div>
                  <div className="result-actions">
                    <button
                      className={`compare-button ${compare ? 'selected' : ''}`}
                      aria-pressed={compare}
                      onClick={() => setCompare(!compare)}
                    >
                      <span className="toggle">
                        <i />
                      </span>
                      Compare rankings
                    </button>
                    <button
                      className="icon-button export-button"
                      onClick={exportResults}
                      disabled={!result}
                      title="Export real search results"
                      aria-label="Export search results"
                    >
                      <Download size={17} />
                    </button>
                  </div>
                </div>
                <div className="results-toolbar">
                  <div className="mode-switch" aria-label="Ranking approach">
                    {(Object.keys(modes) as Mode[]).map((m) => (
                      <button
                        key={m}
                        className={mode === m ? 'selected' : ''}
                        onClick={() => chooseMode(m)}
                      >
                        {m === 'learned' && <Sparkles size={14} />}
                        <span>{modes[m]}</span>
                        {m === 'learned' && <em>LEARNED</em>}
                      </button>
                    ))}
                  </div>
                  <label className="category-filter">
                    <SlidersHorizontal size={14} />
                    <select
                      aria-label="Filter candidate products by category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        void runSearch(result?.query || query, mode, e.target.value);
                      }}
                    >
                      <option value="">All categories</option>
                      {Array.from(new Set([...categories, ...(category ? [category] : [])])).map(
                        (c) => (
                          <option key={c}>{c}</option>
                        ),
                      )}
                    </select>
                    <ChevronDown size={13} />
                  </label>
                </div>
                {error ? (
                  <div className="error-state" role="alert">
                    <CircleHelp size={24} />
                    <h3>Let’s give that another try.</h3>
                    <p>{error}</p>
                    <button onClick={() => void runSearch()}>
                      Retry search <ArrowRight size={15} />
                    </button>
                  </div>
                ) : loading && !result ? (
                  <div className="loading-state" role="status">
                    <LoaderCircle className="spin" size={28} />
                    <h3>Finding the meaning behind your search.</h3>
                    <p>The first search may take a moment while the model starts.</p>
                    <div className="skeleton-row">
                      {[1, 2, 3, 4].map((n) => (
                        <div className="skeleton" key={n} />
                      ))}
                    </div>
                  </div>
                ) : result ? (
                  <>
                    <div className="query-insight">
                      <span className="insight-icon">
                        <WandSparkles size={16} />
                      </span>
                      <div>
                        <strong>Reading the intent</strong>
                        <span>“{result.query}”</span>
                        {Object.entries(result.attributes).map(([key, values]) => (
                          <span className="attribute" key={key}>
                            <small>{key}</small>
                            {values.join(', ')}
                          </span>
                        ))}
                      </div>
                      <span className="query-time">
                        <Clock3 size={12} />
                        {result.timing.total_ms.toFixed(0)} ms <span>engine</span>
                      </span>
                    </div>
                    {result.low_similarity && (
                      <p className="notice">
                        This query has low semantic similarity to the catalogue. These are nearest
                        matches, and may not be relevant.
                      </p>
                    )}
                    {compare ? (
                      <div className={`comparison ${loading ? 'updating' : ''}`}>
                        <div>
                          <div className="comparison-title">
                            <span className="comparison-dot baseline-dot" />
                            <h3>BM25</h3>
                            <span>Keyword matching</span>
                          </div>
                          <div className="comparison-grid">
                            {result.baseline.slice(0, 6).map((p) => (
                              <ProductCard key={p.id} product={p} onOpen={setDetail} compact />
                            ))}
                          </div>
                          {!result.baseline.length && (
                            <div className="empty-state">
                              No keyword matches in these candidates.
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="comparison-title">
                            <span className="comparison-dot" />
                            <h3>{modes[result.mode]}</h3>
                            <span>
                              {result.mode === 'learned'
                                ? 'Learned relevance'
                                : 'Selected approach'}
                            </span>
                          </div>
                          <div className="comparison-grid">
                            {showing?.map((p) => (
                              <ProductCard
                                key={p.id}
                                product={p}
                                promoted={
                                  result.baseline.findIndex((b) => b.id === p.id) + 1 - p.rank
                                }
                                onOpen={setDetail}
                                compact
                              />
                            ))}
                          </div>
                          {!showing?.length && (
                            <div className="empty-state">No results in these candidates.</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`product-grid ${loading ? 'updating' : ''}`}>
                        {showing?.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            promoted={result.baseline.findIndex((b) => b.id === p.id) + 1 - p.rank}
                            onOpen={setDetail}
                          />
                        ))}
                      </div>
                    )}
                    {!result.results.length && (
                      <div className="empty-state">
                        <Search size={25} />
                        <h3>No matches in this view.</h3>
                        <p>Try another query or remove the category filter.</p>
                        <button
                          onClick={() => {
                            setCategory('');
                            void runSearch(query, mode, '');
                          }}
                        >
                          Clear category filter
                        </button>
                      </div>
                    )}
                    <div className="results-footer">
                      <span>
                        {result.results.length} results · {result.candidate_count} hybrid candidates
                        · {fmt(result.catalogue_count)} products searched
                      </span>
                      <span>
                        Category illustrations, not product photos <CircleHelp size={12} />
                      </span>
                    </div>
                  </>
                ) : null}
              </section>
              <section className="research-banner">
                <div className="research-symbol">
                  <FlaskConical size={25} />
                </div>
                <div>
                  <span className="eyebrow light">BUILT TO BE QUESTIONED</span>
                  <h3>A ranking is only as good as its evaluation.</h3>
                  <p>Held-out queries. Transparent baselines. Every number reproducible.</p>
                </div>
                <button onClick={() => setPage('evaluation')}>
                  Explore the evidence <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          ) : page === 'evaluation' ? (
            <EvaluationView
              evaluation={evaluation}
              improvement={improvement}
              metric={metric}
              setMetric={setMetric}
              runSearch={runSearch}
            />
          ) : (
            <ModelView evaluation={evaluation} />
          )}
          <footer className="page-footer">
            <span>
              <Mark small />
              IntentRank <span>·</span> Built by Om Kesharwani
            </span>
            <span>
              Real data. Measurable relevance.
              <a href={REPO} aria-label="GitHub repository" target="_blank" rel="noreferrer">
                <Github size={16} />
              </a>
            </span>
          </footer>
        </div>
      </main>
      {detail && (
        <div className="drawer-backdrop" onClick={() => setDetail(null)}>
          <section
            className="detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                const focusable = Array.from(
                  e.currentTarget.querySelectorAll<HTMLElement>('button,a[href]'),
                );
                if (e.shiftKey && document.activeElement === focusable[0]) {
                  e.preventDefault();
                  focusable.at(-1)?.focus();
                } else if (!e.shiftKey && document.activeElement === focusable.at(-1)) {
                  e.preventDefault();
                  focusable[0]?.focus();
                }
              }
            }}
          >
            <div className="drawer-top">
              <span>PRODUCT EVIDENCE · #{detail.id}</span>
              <button
                ref={detailClose}
                className="icon-button"
                aria-label="Close product details"
                onClick={() => setDetail(null)}
              >
                <X size={20} />
              </button>
            </div>
            <Furniture category={detail.category} />
            <div className="drawer-body">
              <span className="product-category">{detail.category}</span>
              <h2 id="product-detail-title">{detail.name}</h2>
              <p className="breadcrumb">{detail.hierarchy}</p>
              <div className="score-grid">
                <div>
                  <span>Lexical score</span>
                  <strong>{detail.lexical_score.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Cosine similarity</span>
                  <strong>{detail.semantic_score.toFixed(3)}</strong>
                </div>
                <div>
                  <span>Ranking score</span>
                  <strong>{detail.score.toFixed(3)}</strong>
                </div>
              </div>
              <p className="tiny-note">Scores are model outputs, not relevance probabilities.</p>
              <h3>Text evidence</h3>
              <div className="evidence-tags">
                {detail.matched_terms.map((t) => (
                  <span key={t}>
                    <Check size={12} />
                    {t}
                  </span>
                ))}
              </div>
              {Object.keys(detail.missing_attributes).length > 0 && (
                <div className="missing-attrs">
                  <strong>Check these constraints</strong>
                  <p>
                    {Object.entries(detail.missing_attributes)
                      .map(([k, v]) => `${k}: ${v.join(', ')}`)
                      .join(' · ')}{' '}
                    not found in the indexed product text. Missing text does not establish
                    incompatibility.
                  </p>
                </div>
              )}
              <h3>From the catalogue</h3>
              <p className="product-description">
                {detail.description || 'No product description is available.'}
              </p>
              <div className="drawer-attribution">
                Original WANDS text · Category illustration only · No product purchase links
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
