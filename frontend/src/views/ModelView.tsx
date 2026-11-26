import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { REPO, fmt } from '../config';
import type { Evaluation } from '../types';
export function ModelView({ evaluation }: { evaluation: Evaluation | null }) {
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">INSIDE INTENTRANK</div>
        <h1>
          Small model.
          <br />
          <em>Considered decisions.</em>
        </h1>
        <p>A retrieval and ranking system designed to be read, reproduced, and challenged.</p>
      </div>
      {evaluation?.judgment_audit && (
        <section className="panel">
          <span className="eyebrow light">DATA QUALITY BEFORE MODEL COMPLEXITY</span>
          <h2>One pair. One consistent judgment.</h2>
          <p className="small-prose">
            The source audit found {fmt(evaluation.judgment_audit.duplicate_extra_rows)} repeated
            extra rows and {evaluation.judgment_audit.conflicting_pairs_excluded} query-product
            pairs with conflicting labels. Consistent duplicates are collapsed; conflicting pairs
            are excluded. Training and evaluation use{' '}
            {fmt(evaluation.judgment_audit.canonical_pairs)} canonical pairs from{' '}
            {fmt(evaluation.judgment_audit.raw_rows)} raw source rows.
          </p>
          <p className="small-prose">
            Duplicated rows are not treated as independent votes. The same rule is applied to every
            data split before fitting or scoring.
          </p>
        </section>
      )}
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
              BM25 catches precise words. Frozen MiniLM catches semantic similarity. Combine their
              top 100 results.
            </p>
            <span>Lexical + dense retrieval</span>
          </div>
          <div>
            <span className="step-number">02</span>
            <SlidersHorizontal size={24} />
            <h3>Read the details.</h3>
            <p>
              18 shared features capture text overlap, semantic similarity, phrase matches, and
              explicit attribute conflicts.
            </p>
            <span>Same features in training & serving</span>
          </div>
          <div>
            <span className="step-number">03</span>
            <Sparkles size={24} />
            <h3>Learn the order.</h3>
            <p>
              LambdaMART learns from human Exact, Partial, and Irrelevant labels. Validation NDCG
              selects the tree count.
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
            The MiniLM encoder is pretrained and frozen. The gradient-boosted ranking model is
            trained specifically on the WANDS training queries.
          </p>
          <dl className="facts">
            <div>
              <dt>Training pairs</dt>
              <dd>{evaluation ? fmt(evaluation.training.training_pairs) : 'See report'}</dd>
            </div>
            <div>
              <dt>Selected trees</dt>
              <dd>{evaluation?.training.trees ?? 'See report'}</dd>
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
            Training gain importance describes split usage, not a causal explanation.
          </p>
          <div className="importance-chart">
            {evaluation &&
              Object.entries(evaluation.training.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 7)
                .map(([name, gain], _, all) => (
                  <div key={name}>
                    <span>{name.replaceAll('_', ' ')}</span>
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
          <span className="eyebrow light">REPRODUCE THE EXPERIMENT</span>
          <h2>Start with the source.</h2>
          <p>
            Immutable data and encoder revisions, deterministic splits, a regression suite, and a
            machine-readable evaluation report.
          </p>
          <a href={`${REPO}#reproduce-the-experiment`} target="_blank" rel="noreferrer">
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
            This is an independent research portfolio project. Offline ranking improvements do not
            demonstrate sales or revenue impact.
          </p>
        </section>
        <section className="panel">
          <h2>Source & attribution.</h2>
          <p className="small-prose">
            Product text and relevance judgments are from Wayfair WANDS (MIT). The MiniLM encoder is
            distributed under Apache 2.0. Product prices and photos are not included in WANDS; the
            illustrations here represent categories only.
          </p>
          <div className="source-links">
            <a href="https://github.com/wayfair/WANDS" target="_blank" rel="noreferrer">
              WANDS dataset <ExternalLink size={13} />
            </a>
            <a
              href="https://huggingface.co/Xenova/all-MiniLM-L6-v2"
              target="_blank"
              rel="noreferrer"
            >
              Encoder model <ExternalLink size={13} />
            </a>
            <a href={`${REPO}/blob/main/docs/MODEL_CARD.md`} target="_blank" rel="noreferrer">
              Full model card <ExternalLink size={13} />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
