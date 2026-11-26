import { ArrowUpRight, Star } from 'lucide-react';
import { fmt } from '../config';
import type { Product } from '../types';
import { Furniture } from './Furniture';
export function ProductCard({
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
    <button className={`product-card ${compact ? 'compact' : ''}`} onClick={() => onOpen(product)}>
      <div className="product-image">
        <Furniture category={product.category} />
        <span className="rank-number">{String(product.rank).padStart(2, '0')}</span>
        {promoted && promoted > 0 ? <span className="promotion">↑ {promoted}</span> : null}
      </div>
      <div className="product-content">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <div className="product-meta">
          <span>
            <Star size={12} fill="currentColor" />
            {product.rating ? product.rating.toFixed(1) : 'Unrated'}
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
