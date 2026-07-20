import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ProductView } from '../../common/interfaces/productView';
import { Product } from './entities/product.entity';
import { ProductListResponse } from '../../common/interfaces/productListResponse';
import { QueryProductsDto } from './dto/query-products.dto';
import { decodeBrowseCursor, encodeBrowseCursor } from '../../common/utils/cursor.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
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
    return this.findBrowsePage(dto.categoryId, limit, dto.cursor);
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
