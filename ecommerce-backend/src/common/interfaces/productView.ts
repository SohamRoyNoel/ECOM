export interface ProductView {
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
  createdAt: Date;
  isSponsored?: boolean;
  sponsoredLabel?: 'Sponsored';
  relevance?: { score: number; matchType: 'full_text' | 'fuzzy_trigram' };
}