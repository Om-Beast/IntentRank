import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Github,
  Layers3,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
  Zap,
  CircleHelp,
  PanelLeftClose,
  CheckCheck,
  Hash,
  WandSparkles,
} from "lucide-react";
import type { Evaluation, Mode, Product, SearchResult } from "./types";
import "./styles.css";

const REPO = "https://github.com/Om-Beast/IntentRank";
const modes: Record<Mode, string> = {
  learned: "IntentRank",
  bm25: "BM25 keyword",
  semantic: "MiniLM semantic",
  hybrid: "Hybrid RRF",
};
const examples = [
  "sofa with ottoman",
  "turquoise pillows",
  "acrylic clear chair",
  "driftwood mirror",
];
const percent = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmt = (n: number) => new Intl.NumberFormat("en").format(n);

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function Furniture({ category }: { category: string }) {
  const text = category.toLowerCase();
  const type = /chair|recliner|stool/.test(text)
    ? "chair"
    : /sofa|sectional|loveseat/.test(text)
      ? "sofa"
      : /bed|mattress/.test(text)
        ? "bed"
        : /mirror|wall|art|clock/.test(text)
          ? "wall"
          : /light|lamp|chandelier/.test(text)
            ? "lamp"
            : /rug|mat|carpet|pillow|cushion/.test(text)
              ? "soft"
              : "table";
  return (
    <div
      className={`furniture ${type}`}
      aria-label="Category illustration, not a product photograph"
    >
      <svg viewBox="0 0 200 140" aria-hidden="true">
        <ellipse
          cx="100"
          cy="123"
          rx="60"
          ry="7"
          fill="#a4a491"
          opacity=".15"
        />
        {type === "sofa" ? (
          <>
            <path
              d="M53 53Q53 43 64 43H139Q150 43 150 54V97H53Z"
              fill="#899b80"
            />
            <path d="M60 55H98V89H60ZM103 55H143V89H103Z" fill="#a9b79f" />
            <rect x="43" y="78" width="116" height="30" rx="8" fill="#a2b397" />
            <rect x="41" y="69" width="15" height="37" rx="6" fill="#71866a" />
            <rect x="148" y="69" width="15" height="37" rx="6" fill="#71866a" />
            <path
              d="M55 107V121M148 107V121"
              stroke="#5c4939"
              strokeWidth="5"
            />
          </>
        ) : type === "chair" ? (
          <>
            <path d="M73 35Q99 23 125 36L119 82H79Z" fill="#bfa17e" />
            <path d="M76 50Q99 42 122 51" stroke="#d6bea0" strokeWidth="2" />
            <path d="M69 80Q99 69 133 82L128 96H73Z" fill="#b38e64" />
            <path
              d="M77 95L68 122M125 95L134 122M82 95L86 116M120 95L115 116"
              stroke="#694f37"
              strokeWidth="4"
            />
          </>
        ) : type === "bed" ? (
          <>
            <path d="M53 46H147V91H53Z" fill="#ac957b" />
            <path d="M47 78L150 72L167 107H36Z" fill="#e5ddc9" />
            <path d="M48 91L157 87L167 108H36Z" fill="#a2b2a0" />
            <path
              d="M47 107V121M156 107V121"
              stroke="#745d46"
              strokeWidth="5"
            />
            <path
              d="M64 61L94 59L98 75H59ZM105 58L135 57L141 73H103Z"
              fill="#f6f2e6"
            />
          </>
        ) : type === "lamp" ? (
          <>
            <path d="M81 24H119L139 70H62Z" fill="#d4bf99" />
            <path d="M100 70V116" stroke="#77614b" strokeWidth="5" />
            <ellipse cx="100" cy="117" rx="27" ry="5" fill="#8d7558" />
            <path
              d="M82 30L74 63M116 30L126 63"
              stroke="#e6d6b7"
              strokeWidth="2"
            />
          </>
        ) : type === "wall" ? (
          <>
            <rect x="58" y="20" width="85" height="99" rx="42" fill="#ac8f6b" />
            <rect x="65" y="27" width="71" height="85" rx="35" fill="#d4ded6" />
            <path
              d="M72 92L122 35"
              stroke="#f0f1e7"
              strokeWidth="14"
              opacity=".65"
            />
          </>
        ) : type === "soft" ? (
          <>
            <path
              d="M61 35Q97 43 137 34Q129 77 141 112Q97 105 58 112Q69 76 61 35Z"
              fill="#719b99"
            />
            <path
              d="M70 46Q99 52 127 44Q121 76 130 102Q99 97 69 102Q77 76 70 46Z"
              fill="none"
              stroke="#afc4b5"
            />
            <path
              d="M76 48L124 99M97 47L129 81M70 67L105 101"
              stroke="#b1c6b6"
              opacity=".35"
            />
          </>
        ) : (
          <>
            <path d="M47 72L118 49L163 68L90 95Z" fill="#bda182" />
            <path
              d="M47 72V80L90 102V95ZM90 95L163 68V76L90 102Z"
              fill="#a58765"
            />
            <path
              d="M57 83V118M151 82V115M93 101V128M116 63V92"
              stroke="#6e543a"
              strokeWidth="5"
            />
          </>
        )}
      </svg>
      <span>category study</span>
    </div>
  );
}

function ProductCard({
  product,
  promoted,
  onOpen,
  compact = false,
}: {
  product: Product;
  promoted?: number;
  onOpen: (p: Product) => void;
  compact?: boolean;
}) {
  return (
    <button
      className={`product-card ${compact ? "compact" : ""}`}
      onClick={() => onOpen(product)}
    >
      <div className="product-image">
        <Furniture category={product.category} />
        <span className="rank-number">
          {String(product.rank).padStart(2, "0")}
        </span>
        {promoted && promoted > 0 ? (
          <span className="promotion">↑ {promoted}</span>
        ) : null}
      </div>
      <div className="product-content">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <div className="product-meta">
          <span>
            <Star size={12} fill="currentColor" />
            {product.rating ? product.rating.toFixed(1) : "Unrated"}
            {product.reviews > 0 && <em>({fmt(product.reviews)})</em>}
          </span>
          <ArrowUpRight size={16} />
        </div>
        <div className="matched">
          {product.matched_terms.slice(0, 4).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

function App() {
  const params = new URLSearchParams(location.search);
  const [page, setPage] = useState("search");
  const [query, setQuery] = useState(params.get("q") || "sofa with ottoman");
  const [mode, setMode] = useState<Mode>("learned");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [compare, setCompare] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [metric, setMetric] = useState("judged_pool_ndcg10");
  const [category, setCategory] = useState("");

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const detailClose = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetch("/api/evaluation")
      .then((r) => {
        if (!r.ok) throw Error("Evaluation unavailable");
        return r.json();
      })
      .then(setEvaluation)
      .catch(() => {});
    return () => request.current?.abort();
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && !(e.target instanceof HTMLInputElement)) ||
        ((e.ctrlKey || e.metaKey) && e.key === "k")
      ) {
        e.preventDefault();
        setPage("search");
        input.current?.focus();
      }
      if (e.key === "Escape") {
        setDetail(null);
        setFocused(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (detail) {
      previousFocus.current = document.activeElement as HTMLElement;
      detailClose.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
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

  async function runSearch(
    value = query,
    selected = mode,
    selectedCategory = category,
  ) {
    if (!value.trim()) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    setQuery(value);
    setFocused(false);
    setPage("search");
    const url = new URL(location.href);
    url.searchParams.set("q", value);
    history.replaceState({}, "", url);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(value)}&mode=${selected}&limit=12${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ""}`,
        { signal: controller.signal },
      );
      if (!response.ok)
        throw Error(
          response.status === 503
            ? "The search model is starting. Please try again in a moment."
            : "Search could not be completed. Please try again.",
        );
      const data: SearchResult = await response.json();
      if (!controller.signal.aborted) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Search failed.");
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
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "intentrank-search.json";
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
    new Set(
      [...(result?.results || []), ...(result?.baseline || [])].map(
        (p) => p.category,
      ),
    ),
  ).sort();
  const showing = compare ? result?.results.slice(0, 6) : result?.results;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="IntentRank home">
          <Mark />
          <span>
            IntentRank<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">SEARCH WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={page === "search" ? "active" : ""}
            onClick={() => setPage("search")}
          >
            <Search size={18} />
            Search lab<span className="nav-key">/</span>
          </button>
          <button
            className={page === "evaluation" ? "active" : ""}
            onClick={() => setPage("evaluation")}
          >
            <BarChart3 size={18} />
            Evaluation
          </button>
          <button
            className={page === "model" ? "active" : ""}
            onClick={() => setPage("model")}
          >
            <Layers3 size={18} />
            Model card
          </button>
          <a
            href={`${REPO}#reproduce-the-experiment`}
            target="_blank"
            rel="noreferrer"
          >
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
          <button onClick={() => setPage("model")}>
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
      <main>
        <header className="topbar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {page === "search"
                ? "Search lab"
                : page === "evaluation"
                  ? "Evaluation"
                  : "Model card"}
            </strong>
          </div>
          <a
            href="https://github.com/wayfair/WANDS"
            target="_blank"
            rel="noreferrer"
          >
            <span className="status-dot" /> REAL DATA · OPEN SOURCE{" "}
            <ArrowUpRight size={13} />
          </a>
        </header>
        <div className="main-content">
          {page === "search" ? (
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
                    <br className="desktop-break" /> and understanding what
                    someone is looking for.
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
                    <span>{loading ? "Searching" : "Explore"}</span>
                  </button>
                </form>
                {focused && suggestions.length > 0 && (
                  <div
                    className="suggestions"
                    role="listbox"
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
              <section
                className="overview-strip"
                aria-label="Dataset and model summary"
              >
                <div>
                  <Database size={16} />
                  <strong>
                    {evaluation
                      ? fmt(evaluation.training.product_count)
                      : "42,994"}
                  </strong>
                  <span>real products</span>
                </div>
                <div>
                  <CheckCheck size={16} />
                  <strong>
                    {evaluation
                      ? fmt(evaluation.training.label_count)
                      : "233,448"}
                  </strong>
                  <span>human judgments</span>
                </div>
                <div>
                  <GitBranch size={16} />
                  <strong>4</strong>
                  <span>ranking approaches</span>
                </div>
                <button onClick={() => setPage("evaluation")}>
                  {improvement !== null ? (
                    <>
                      <span className="mini-chart">↗</span>
                      <strong>
                        {improvement >= 0 ? "+" : ""}
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
                    <h2>
                      {compare
                        ? "Two rankings. One query."
                        : "Relevance, in the details."}
                    </h2>
                  </div>
                  <div className="result-actions">
                    <button
                      className={`compare-button ${compare ? "selected" : ""}`}
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
                        className={mode === m ? "selected" : ""}
                        onClick={() => chooseMode(m)}
                      >
                        {m === "learned" && <Sparkles size={14} />}
                        <span>{modes[m]}</span>
                        {m === "learned" && <em>LEARNED</em>}
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
                        void runSearch(
                          result?.query || query,
                          mode,
                          e.target.value,
                        );
                      }}
                    >
                      <option value="">All categories</option>
                      {Array.from(
                        new Set([
                          ...categories,
                          ...(category ? [category] : []),
                        ]),
                      ).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
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
                    <p>
                      The first search may take a moment while the model starts.
                    </p>
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
                        {Object.entries(result.attributes).map(
                          ([key, values]) => (
                            <span className="attribute" key={key}>
                              <small>{key}</small>
                              {values.join(", ")}
                            </span>
                          ),
                        )}
                      </div>
                      <span className="query-time">
                        <Clock3 size={12} />
                        {result.timing.total_ms.toFixed(0)} ms{" "}
                        <span>engine</span>
                      </span>
                    </div>
                    {result.low_similarity && (
                      <p className="notice">
                        This query has low semantic similarity to the catalogue.
                        These are nearest matches, and may not be relevant.
                      </p>
                    )}
                    {compare ? (
                      <div
                        className={`comparison ${loading ? "updating" : ""}`}
                      >
                        <div>
                          <div className="comparison-title">
                            <span className="comparison-dot baseline-dot" />
                            <h3>BM25</h3>
                            <span>Keyword matching</span>
                          </div>
                          <div className="comparison-grid">
                            {result.baseline.slice(0, 6).map((p) => (
                              <ProductCard
                                key={p.id}
                                product={p}
                                onOpen={setDetail}
                                compact
                              />
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
                              {result.mode === "learned"
                                ? "Learned relevance"
                                : "Selected approach"}
                            </span>
                          </div>
                          <div className="comparison-grid">
                            {showing?.map((p) => (
                              <ProductCard
                                key={p.id}
                                product={p}
                                promoted={
                                  result.baseline.findIndex(
                                    (b) => b.id === p.id,
                                  ) +
                                  1 -
                                  p.rank
                                }
                                onOpen={setDetail}
                                compact
                              />
                            ))}
                          </div>
                          {!showing?.length && (
                            <div className="empty-state">
                              No results in these candidates.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`product-grid ${loading ? "updating" : ""}`}
                      >
                        {showing?.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            promoted={
                              result.baseline.findIndex((b) => b.id === p.id) +
                              1 -
                              p.rank
                            }
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
                            setCategory("");
                            void runSearch(query, mode, "");
                          }}
                        >
                          Clear category filter
                        </button>
                      </div>
                    )}
                    <div className="results-footer">
                      <span>
                        {result.results.length} results ·{" "}
                        {result.candidate_count} hybrid candidates ·{" "}
                        {fmt(result.catalogue_count)} products searched
                      </span>
                      <span>
                        Category illustrations, not product photos{" "}
                        <CircleHelp size={12} />
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
                  <p>
                    Held-out queries. Transparent baselines. Every number
                    reproducible.
                  </p>
                </div>
                <button onClick={() => setPage("evaluation")}>
                  Explore the evidence <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          ) : page === "evaluation" ? (
            <>
              <div className="page-intro">
                <div className="eyebrow">THE EVIDENCE</div>
                <h1>
                  Measure what <em>matters.</em>
                </h1>
                <p>
                  Real judgments, held-out queries, and the uncertainty behind
                  the numbers.
                </p>
              </div>
              {!evaluation ? (
                <div className="loading-state">
                  <BarChart3 size={28} />
                  <p>Evaluation report is loading or unavailable.</p>
                  <button onClick={() => location.reload()}>
                    Reload report
                  </button>
                </div>
              ) : (
                <>
                  <div className="metric-cards">
                    <div>
                      <span>PRIMARY METRIC</span>
                      <strong>
                        {evaluation.models.learned.judged_pool_ndcg10.mean.toFixed(
                          3,
                        )}
                      </strong>
                      <p>Judged-pool NDCG@10</p>
                      <small>
                        95% CI{" "}
                        {evaluation.models.learned.judged_pool_ndcg10.ci95
                          .map((v) => v.toFixed(3))
                          .join(" – ")}
                      </small>
                    </div>
                    <div>
                      <span>VERSUS KEYWORD BASELINE</span>
                      <strong>
                        {improvement !== null && improvement >= 0 ? "+" : ""}
                        {improvement?.toFixed(1)}
                        <em>%</em>
                      </strong>
                      <p>Relative NDCG improvement</p>
                      <small>
                        Paired Δ 95% CI{" "}
                        {evaluation.paired_delta_ci95
                          .map((v) => v.toFixed(3))
                          .join(" – ")}
                      </small>
                    </div>
                    <div>
                      <span>HELD-OUT TEST QUERIES</span>
                      <strong>{evaluation.test_queries}</strong>
                      <p>Never used for model fitting</p>
                      <small>
                        {evaluation.training.split_counts.train} train ·{" "}
                        {evaluation.training.split_counts.validation} validation
                      </small>
                    </div>
                  </div>
                  <div className="statistical-note">
                    <strong>Read the tradeoff.</strong> The learned model’s
                    paired improvement over BM25 is not statistically conclusive
                    at 95% on these 72 queries. Hybrid RRF leads the separate
                    full-catalogue NDCG@10 evaluation. A stronger reranker is an
                    experiment, not a guaranteed win.
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
                        <option value="judged_pool_ndcg10">
                          Judged-pool NDCG@10
                        </option>
                        <option value="catalogue_ndcg10">
                          Full-catalogue NDCG@10*
                        </option>
                        <option value="recall100">
                          Known-positive Recall@100
                        </option>
                        <option value="judged_at10">
                          Judgment coverage @10
                        </option>
                      </select>
                    </div>
                    <div className="bar-chart">
                      {(Object.keys(modes) as Mode[]).map((m) => {
                        const value = evaluation.models[m][metric];
                        return (
                          <div
                            className={`bar-row ${m === "learned" ? "highlight" : ""}`}
                            key={m}
                          >
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
                        {metric === "judged_pool_ndcg10"
                          ? evaluation.protocol.primary
                          : metric === "catalogue_ndcg10"
                            ? evaluation.protocol.catalogue
                            : metric === "recall100"
                              ? evaluation.protocol.recall
                              : "Fraction of the top ten returned products with an existing WANDS judgment. Unjudged does not mean irrelevant."}{" "}
                        Whiskers show query-bootstrap 95% intervals.
                      </p>
                    </div>
                  </section>
                  <div className="two-panels">
                    <section className="panel">
                      <span className="eyebrow light">
                        PERFORMANCE ENVELOPE
                      </span>
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
                      <p className="small-prose">
                        {evaluation.latency.environment}
                      </p>
                    </section>
                    <section className="panel">
                      <span className="eyebrow light">
                        CANDIDATE GENERATION
                      </span>
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
                        {percent(evaluation.candidate_recall)} mean
                        known-positive recall in the combined candidate pool. A
                        reranker cannot recover products absent from that pool.
                      </p>
                    </section>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Look closer at individual queries.</h2>
                        <p>
                          All held-out queries, sorted by learned versus BM25
                          NDCG delta.
                        </p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => {
                          const blob = new Blob(
                            [JSON.stringify(evaluation, null, 2)],
                            { type: "application/json" },
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "intentrank-evaluation.json";
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
                                (a.metrics.learned.judged_pool_ndcg10 -
                                  a.metrics.bm25.judged_pool_ndcg10),
                            )
                            .map((q) => {
                              const delta =
                                q.metrics.learned.judged_pool_ndcg10 -
                                q.metrics.bm25.judged_pool_ndcg10;
                              return (
                                <tr key={q.id}>
                                  <td>{q.query}</td>
                                  <td>{q.judgments}</td>
                                  <td>
                                    {q.metrics.bm25.judged_pool_ndcg10.toFixed(
                                      3,
                                    )}
                                  </td>
                                  <td>
                                    {q.metrics.learned.judged_pool_ndcg10.toFixed(
                                      3,
                                    )}
                                  </td>
                                  <td
                                    className={
                                      delta >= 0 ? "positive" : "negative"
                                    }
                                  >
                                    {delta >= 0 ? "+" : ""}
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
                        {evaluation.training.split_policy}.{" "}
                        {evaluation.protocol.selection}{" "}
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
          ) : (
            <>
              <div className="page-intro">
                <div className="eyebrow">INSIDE INTENTRANK</div>
                <h1>
                  Small model.
                  <br />
                  <em>Considered decisions.</em>
                </h1>
                <p>
                  A retrieval and ranking system designed to be read,
                  reproduced, and challenged.
                </p>
              </div>
              <section className="panel architecture">
                <div className="panel-heading">
                  <div>
                    <h2>From a few words to a better shortlist.</h2>
                    <p>No remote LLM calls. No invented relevance labels.</p>
                  </div>
                  <span className="tag">CPU INFERENCE</span>
                </div>
                <div className="architecture-steps">
                  <div>
                    <span className="step-number">01</span>
                    <Search size={24} />
                    <h3>Retrieve broadly.</h3>
                    <p>
                      BM25 catches precise words. Frozen MiniLM catches semantic
                      similarity. Combine their top 100 results.
                    </p>
                    <span>Lexical + dense retrieval</span>
                  </div>
                  <div>
                    <span className="step-number">02</span>
                    <SlidersHorizontal size={24} />
                    <h3>Read the details.</h3>
                    <p>
                      18 shared features capture text overlap, semantic
                      similarity, phrase matches, and explicit attribute
                      conflicts.
                    </p>
                    <span>Same features in training & serving</span>
                  </div>
                  <div>
                    <span className="step-number">03</span>
                    <Sparkles size={24} />
                    <h3>Learn the order.</h3>
                    <p>
                      LambdaMART learns from human Exact, Partial, and
                      Irrelevant labels. Validation NDCG selects the tree count.
                    </p>
                    <span>Query-grouped learning to rank</span>
                  </div>
                </div>
              </section>
              <div className="two-panels">
                <section className="panel">
                  <span className="eyebrow light">THE TRAINED COMPONENT</span>
                  <h2>LambdaMART reranker.</h2>
                  <p className="small-prose">
                    The MiniLM encoder is pretrained and frozen. The
                    gradient-boosted ranking model is trained specifically on
                    the WANDS training queries.
                  </p>
                  <dl className="facts">
                    <div>
                      <dt>Training pairs</dt>
                      <dd>
                        {evaluation
                          ? fmt(evaluation.training.training_pairs)
                          : "See report"}
                      </dd>
                    </div>
                    <div>
                      <dt>Selected trees</dt>
                      <dd>{evaluation?.training.trees ?? "See report"}</dd>
                    </div>
                    <div>
                      <dt>Objective</dt>
                      <dd>LambdaRank · NDCG@10</dd>
                    </div>
                    <div>
                      <dt>Label gains</dt>
                      <dd>Irrelevant 0 · Partial 1 · Exact 3</dd>
                    </div>
                    <div>
                      <dt>Inference</dt>
                      <dd>Quantized ONNX + exported trees</dd>
                    </div>
                  </dl>
                </section>
                <section className="panel">
                  <span className="eyebrow light">FEATURE IMPORTANCE</span>
                  <h2>What the ranker uses.</h2>
                  <p className="small-prose">
                    Training gain importance describes split usage, not a causal
                    explanation.
                  </p>
                  <div className="importance-chart">
                    {evaluation &&
                      Object.entries(evaluation.training.feature_importance)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 7)
                        .map(([name, gain], _, all) => (
                          <div key={name}>
                            <span>{name.replaceAll("_", " ")}</span>
                            <div>
                              <i
                                style={{
                                  width: `${(gain / all[0][1]) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                  </div>
                </section>
              </div>
              <section className="panel provenance">
                <div>
                  <span className="eyebrow light">
                    REPRODUCE THE EXPERIMENT
                  </span>
                  <h2>Start with the source.</h2>
                  <p>
                    Immutable data and encoder revisions, deterministic splits,
                    a regression suite, and a machine-readable evaluation
                    report.
                  </p>
                  <a
                    href={`${REPO}#reproduce-the-experiment`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the setup guide <ArrowUpRight size={15} />
                  </a>
                </div>
                <div className="code-snippet">
                  <span>TERMINAL</span>
                  <code>
                    git clone https://github.com/Om-Beast/IntentRank
                    <br />
                    cd IntentRank
                    <br />
                    pip install -r requirements-dev.txt
                    <br />
                    python scripts/bootstrap.py --train
                    <br />
                    npm ci &amp;&amp; npm run build
                    <br />
                    uvicorn app:app --port 8000
                  </code>
                </div>
              </section>
              <div className="two-panels">
                <section className="panel">
                  <h2>Honest scope.</h2>
                  <ul className="scope-list">
                    <li>
                      <Check size={15} />
                      Full 42,994-product catalogue
                    </li>
                    <li>
                      <Check size={15} />A real, trained relevance model
                    </li>
                    <li>
                      <Check size={15} />
                      New-query held-out evaluation
                    </li>
                    <li>
                      <Check size={15} />
                      Inspectable search evidence
                    </li>
                  </ul>
                  <p className="small-prose">
                    This is an independent research portfolio project. Offline
                    ranking improvements do not demonstrate sales or revenue
                    impact.
                  </p>
                </section>
                <section className="panel">
                  <h2>Source & attribution.</h2>
                  <p className="small-prose">
                    Product text and relevance judgments are from Wayfair WANDS
                    (MIT). The MiniLM encoder is distributed under Apache 2.0.
                    Product prices and photos are not included in WANDS; the
                    illustrations here represent categories only.
                  </p>
                  <div className="source-links">
                    <a
                      href="https://github.com/wayfair/WANDS"
                      target="_blank"
                      rel="noreferrer"
                    >
                      WANDS dataset <ExternalLink size={13} />
                    </a>
                    <a
                      href="https://huggingface.co/Xenova/all-MiniLM-L6-v2"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Encoder model <ExternalLink size={13} />
                    </a>
                    <a
                      href={`${REPO}/blob/main/docs/MODEL_CARD.md`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Full model card <ExternalLink size={13} />
                    </a>
                  </div>
                </section>
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>
              <Mark small />
              IntentRank <span>·</span> Built by Om Kesharwani
            </span>
            <span>
              Real data. Measurable relevance.
              <a
                href={REPO}
                aria-label="GitHub repository"
                target="_blank"
                rel="noreferrer"
              >
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
              if (e.key === "Tab") {
                const focusable = Array.from(
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "button,a[href]",
                  ),
                );
                if (e.shiftKey && document.activeElement === focusable[0]) {
                  e.preventDefault();
                  focusable.at(-1)?.focus();
                } else if (
                  !e.shiftKey &&
                  document.activeElement === focusable.at(-1)
                ) {
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
              <p className="tiny-note">
                Scores are model outputs, not relevance probabilities.
              </p>
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
                      .map(([k, v]) => `${k}: ${v.join(", ")}`)
                      .join(" · ")}{" "}
                    not found in the indexed product text. Missing text does not
                    establish incompatibility.
                  </p>
                </div>
              )}
              <h3>From the catalogue</h3>
              <p className="product-description">
                {detail.description || "No product description is available."}
              </p>
              <div className="drawer-attribution">
                Original WANDS text · Category illustration only · No product
                purchase links
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
