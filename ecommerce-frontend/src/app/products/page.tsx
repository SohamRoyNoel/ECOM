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

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [limitInput, setLimitInput] = useState(String(DEFAULT_LIMIT));
  const debouncedLimit = useDebouncedValue(limitInput, 500);

  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [mode, setMode] = useState<'search' | 'browse'>('browse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<string | null>(null);
  cursorRef.current = cursor;

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ data: Category[] }>('/categories', { token })
      .then((res) => setCategories(res.data))
      .catch(() => {
      });
  }, [token]);

  const handleUnauthorized = useCallback(() => {
    logout('expired');
  }, [logout]);


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

  useEffect(() => {
    if (!token) return;
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    fetchPage(true);
  }, [token, debouncedSearch, categoryId, debouncedLimit]);

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
