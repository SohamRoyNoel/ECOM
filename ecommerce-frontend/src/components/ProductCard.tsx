import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <li className={product.isSponsored ? 'product-card product-card--sponsored' : 'product-card'}>
      {product.isSponsored && <span className="badge">Sponsored</span>}

      {product.imageUrl && (
        <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
      )}

      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>

        {!product.isSponsored && <p className="product-category">{product.categoryName}</p>}

        <p className="product-price">
          {product.currency} {product.price}
        </p>

        {!product.isSponsored && (
          <p className="product-stock">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
          </p>
        )}

        {product.description && <p className="product-description">{product.description}</p>}

        {product.relevance && (
          <p className="product-relevance">
            match: {product.relevance.matchType === 'full_text' ? 'exact/stemmed' : 'fuzzy (typo-tolerant)'}
          </p>
        )}
      </div>
    </li>
  );
}
