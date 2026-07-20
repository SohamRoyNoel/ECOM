'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { Category, Product, ProductListResponse } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

const MIN_LIMIT = 5;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export default function ProductsPage() {
  const { token, user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  // ---- filter/search/page-size controls (each just its own useState -
  // there's no need to share these outside this page) ----
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [limitInput, setLimitInput] = useState(String(DEFAULT_LIMIT));
  const debouncedLimit = useDebouncedValue(limitInput, 500);

  // ---- catalog data ----
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [mode, setMode] = useState<'search' | 'browse'>('browse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Cursor changes on every page load, but the infinite-scroll observer
  // effect shouldn't re-subscribe every time - it reads the latest cursor
  // via this ref instead of taking it as a dependency.
  const cursorRef = useRef<string | null>(null);
  cursorRef.current = cursor;

  // Redirect unauthenticated visitors. This runs after AuthProvider's own
  // localStorage check finishes (authLoading), so it doesn't briefly bounce
  // someone who's actually logged in.
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [authLoading, token, router]);

  // Category list for the filter dropdown - fetched once auth is ready.
  useEffect(() => {
    if (!token) return;
    apiFetch<{ data: Category[] }>('/categories', { token })
      .then((res) => setCategories(res.data))
      .catch(() => {
        // Non-critical: the page still works without the filter populated.
      });
  }, [token]);

  const handleUnauthorized = useCallback(() => {
    logout('expired');
  }, [logout]);

  /**
   * Fetches one page. `reset: true` starts a fresh list (new search/filter/
   * page size); `reset: false` appends the next page using the current cursor.
   */
  const fetchPage = useCallback(
    async (reset: boolean) => {
      if (!token) return;

      const parsedLimit = Number(debouncedLimit);
      if (!Number.isFinite(parsedLimit)) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (categoryId !== '') params.set('categoryId', String(categoryId));
        params.set('limit', String(parsedLimit));
        if (!reset && cursorRef.current) params.set('cursor', cursorRef.current);

        const res = await apiFetch<ProductListResponse>(`/products?${params.toString()}`, {
          token,
        });

        setProducts((prev) => (reset ? res.data : [...prev, ...res.data]));
        setCursor(res.pagination.nextCursor);
        setHasMore(res.pagination.hasMore);
        setMode(res.meta.mode);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    },
    [token, debouncedSearch, categoryId, debouncedLimit, handleUnauthorized],
  );

  // Whenever search text, category, or page size (settled/debounced values)
  // change, throw away the current list and start over from page one.
  useEffect(() => {
    if (!token) return;
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    fetchPage(true);
    // fetchPage is intentionally the only other dependency; it already
    // captures debouncedSearch/categoryId/debouncedLimit/token internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, debouncedSearch, categoryId, debouncedLimit]);

  // Infinite scroll: observe a sentinel element at the bottom of the list;
  // load the next page whenever it scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPage(false);
        }
      },
      { rootMargin: '250px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchPage]);

  if (authLoading || !token) {
    return (
      <main className="container">
        <p className="status-text">Loading...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="topbar">
        <h1>Product Catalog</h1>
        <div className="topbar-user">
          <span>Signed in as {user?.username}</span>
          <button type="button" className="secondary" onClick={() => logout('manual')}>
            Log out
          </button>
        </div>
      </header>

      <section className="controls">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search products"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <label htmlFor="limit">
          Page size ({MIN_LIMIT}-{MAX_LIMIT})
          <input
            id="limit"
            type="number"
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
          />
        </label>
      </section>

      {error && <p className="error-text">{error}</p>}

      <p className="status-text">
        {mode === 'search' ? `Search results for "${debouncedSearch}"` : 'Browsing all products'}
        {' \u00b7 '}
        {products.length} loaded
      </p>

      <ul className="product-list">
        {products.map((product, index) => (
          // Sponsored items can repeat across pages (rotated from a small
          // pool), so `id` alone isn't a unique React key - combine with
          // the item's position in the loaded list instead.
          <ProductCard key={`${product.id}-${index}`} product={product} />
        ))}
      </ul>

      <div ref={sentinelRef} className="sentinel">
        {loading && <span>Loading more...</span>}
        {!loading && !hasMore && products.length > 0 && <span>No more products.</span>}
        {!loading && products.length === 0 && !error && <span>No products found.</span>}
      </div>
    </main>
  );
}
