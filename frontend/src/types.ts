export type Mode = 'learned' | 'bm25' | 'semantic' | 'hybrid';
export type Product = {
  id: number;
  name: string;
  category: string;
  hierarchy: string;
  description: string;
  rating: number;
  reviews: number;
  rank: number;
  score: number;
  lexical_score: number;
  semantic_score: number;
  matched_terms: string[];
  missing_attributes: Record<string, string[]>;
};
export type SearchResult = {
  query: string;
  normalized_query: string;
  mode: Mode;
  attributes: Record<string, string[]>;
  tokens: string[];
  results: Product[];
  baseline: Product[];
  candidate_count: number;
  catalogue_count: number;
  low_similarity: boolean;
  timing: { retrieval_ms: number; ranking_ms: number; total_ms: number };
  score_note: string;
};
export type Metric = { mean: number; ci95: number[] };
export type QueryRecord = {
  id: number;
  query: string;
  judgments: number;
  relevant: number;
  candidate_recall: number;
  metrics: Record<Mode, Record<string, number>>;
};
export type Evaluation = {
  judgment_audit?: {
    raw_rows: number;
    canonical_pairs: number;
    duplicate_extra_rows: number;
    conflicting_pairs_excluded: number;
    policy: string;
  };
  test_queries: number;
  models: Record<Mode, Record<string, Metric>>;
  queries: QueryRecord[];
  paired_delta_ci95: number[];
  candidate_recall: number;
  latency: {
    p50_ms: number;
    p95_ms: number;
    environment: string;
    samples: number;
  };
  protocol: {
    primary: string;
    catalogue: string;
    recall: string;
    uncertainty: string;
    selection: string;
    caveats: string[];
  };
  training: {
    product_count: number;
    query_count: number;
    label_count: number;
    split_counts: Record<string, number>;
    training_pairs: number;
    validation_pairs: number;
    trees: number;
    training_seconds: number;
    encoder: string;
    encoder_revision: string;
    dataset_revision: string;
    feature_importance: Record<string, number>;
    split_policy: string;
    features: string[];
  };
};
