import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { ProductView } from '../../common/interfaces/productView';
import { Product } from './entities/product.entity';
import { ProductListResponse } from '../../common/interfaces/productListResponse';
import { QueryProductsDto } from './dto/query-products.dto';
import { decodeBrowseCursor, decodeSearchCursor, encodeBrowseCursor, encodeSearchCursor } from '../../common/utils/cursor.util';
import { CONSTANTS } from '../../common/CONSTANTS';
import { planSponsoredPage } from '../../common/utils/sponsored-slot.util';
import { SponsoredService } from '../sponsored/sponsored.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    private readonly sponsoredService: SponsoredService,
  ) {}

  async findById(id: string): Promise<ProductView> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }
    return this.toProductView(product);
  }

  async findPage(dto: QueryProductsDto): Promise<ProductListResponse> {
    const limit = dto.limit ?? 20;
    const query = dto.q?.trim();
    if (query) {
      // EXclude Sponsor HEre
      return this.findSearchPage(query, dto.categoryId, limit, dto.cursor);
    }
    return this.findBrowsePage(dto.categoryId, limit, dto.cursor);
  }

  // Full-Text Search
  // GIN index optimization
  // Stemming support - Jumble words
  // Trigram similarity fallback - Handles TYPO
  // Fuzzy search
  // deDup
  // Summary: COmbined FTS and trigram
  private async findSearchPage(
    query: string,
    categoryId: number | undefined,
    limit: number,
    cursor: string | undefined,
  ): Promise<ProductListResponse> {
    const { offset } = decodeSearchCursor(cursor);

    const params: unknown[] = [query];
    let categoryFilter = '';
    if (categoryId) {
      params.push(categoryId);
      categoryFilter = `AND category_id = $${params.length}`;
    }
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    params.push(limit + 1, offset); // fetch one extra row to cheaply detect hasMore

    const sql = `
      WITH fts_matches AS (
        SELECT id,
               ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS score,
               1 AS source_rank
        FROM products
        WHERE search_vector @@ websearch_to_tsquery('english', $1)
          AND is_active = true
          ${categoryFilter}
      ),
      trgm_matches AS (
        SELECT id,
               GREATEST(similarity(name, $1), similarity(coalesce(description, ''), $1)) AS score,
               2 AS source_rank
        FROM products
        WHERE (similarity(name, $1) > 0.25 OR similarity(coalesce(description, ''), $1) > 0.2)
          AND is_active = true
          ${categoryFilter}
          AND id NOT IN (SELECT id FROM fts_matches)
      ),
      combined AS (
        SELECT * FROM fts_matches
        UNION ALL
        SELECT * FROM trgm_matches
      )
      SELECT ${CONSTANTS.RAW_PRODUCT_COLUMNS}, combined.score AS score, combined.source_rank AS "sourceRank"
      FROM combined
      JOIN products p ON p.id = combined.id
      JOIN categories c ON c.id = p.category_id
      ORDER BY combined.source_rank ASC, combined.score DESC, p.id ASC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rows: any[] = await this.dataSource.query(sql, params);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    const data: ProductView[] = page.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      price: row.price,
      currency: row.currency,
      stockQuantity: row.stockQuantity,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt,
      relevance: {
        score: Number(row.score),
        matchType: Number(row.sourceRank) === 1 ? 'full_text' : 'fuzzy_trigram',
      },
    }));

    return {
      data,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? encodeSearchCursor({ offset: offset + limit }) : null,
      },
      meta: { mode: 'search', query, categoryId },
    };
  }

  private async findBrowsePage(
    categoryId: number | undefined,
    limit: number,
    cursor: string | undefined,
  ): Promise<ProductListResponse> {
  const { lastId, organicOffset } = decodeBrowseCursor(cursor);

  const products = await this.productRepository.find({
    where: {
      isActive: true,
      id: MoreThan(lastId),
      ...(categoryId ? { categoryId } : {}),
    },
    relations: { category: true },
    order: { id: 'ASC' },
    take: limit + 1,
  });

  const hasMore = products.length > limit;
  const organicProducts = products.slice(0, limit);
  const data: ProductView[] = organicProducts.map((p) => this.toProductView(p));

  if (organicProducts.length > 0) {
    const plan = planSponsoredPage(organicOffset, data.length);
    const slotNumbers = plan.layout
      .filter((s): s is { type: 'sponsored'; slotNumber: number } => s.type === 'sponsored')
      .map((s) => s.slotNumber);

    if (slotNumbers.length > 0) {
      const sponsoredMap = await this.sponsoredService.getManyForSlots(slotNumbers);
      const merged: ProductView[] = [];
      let organicCursor = 0;
      for (const slot of plan.layout) {
        if (slot.type === 'organic') {
          merged.push(data[organicCursor]);
          organicCursor += 1;
        } else {
          const sponsored = sponsoredMap.get(slot.slotNumber);
          if (sponsored) {
            merged.push({
              id: sponsored.id,
              name: sponsored.name,
              description: sponsored.description,
              sku: '',
              categoryId: sponsored.categoryId,
              categoryName: '',
              price: sponsored.price,
              currency: sponsored.currency,
              stockQuantity: 0,
              imageUrl: sponsored.imageUrl,
              createdAt: new Date(0),
              isSponsored: true,
              sponsoredLabel: 'Sponsored',
            });
          }
        }
      }
      data.length = 0;
      data.push(...merged);
    }
  }

  const lastOrganicId =
    organicProducts.length > 0 ? organicProducts[organicProducts.length - 1].id : lastId;
  const nextOrganicOffset = organicOffset + organicProducts.length;

  return {
    data,
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore
        ? encodeBrowseCursor({ lastId: String(lastOrganicId), organicOffset: nextOrganicOffset })
        : null,
    },
    meta: { mode: 'browse', categoryId },
  };
}

  private toProductView(product: Product): ProductView {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? '',
      price: product.price,
      currency: product.currency,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
    };
  }
}
