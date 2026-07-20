export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  categoryId: number;
  categoryName: string;
  price: string;
  currency: string;
  stockQuantity: number;
  imageUrl: string | null;
  createdAt: string;
  isSponsored?: boolean;
  sponsoredLabel?: 'Sponsored';
  relevance?: { score: number; matchType: 'full_text' | 'fuzzy_trigram' };
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
  meta: {
    mode: 'search' | 'browse';
    query?: string;
    categoryId?: number;
  };
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: User;
}
