import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductView } from '../../common/interfaces/productView';
import { Product } from './entities/product.entity';

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
