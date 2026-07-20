import { ProductView } from "./productView";

export interface ProductListResponse {
  data: ProductView[];
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