import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SponsoredItem } from './entities/sponsored-item.entity';
import { Product } from '../products/entities/product.entity';
import { CONSTANTS } from '../../common/CONSTANTS';

export interface SponsoredProductView {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  imageUrl: string | null;
  categoryId: number;
  isSponsored: true;
  sponsoredLabel: 'Sponsored';
}

@Injectable()
export class SponsoredService {
  private poolCache: { items: SponsoredProductView[]; expiresAt: number } | null = null;
  private readonly poolTtlMs = 30_000;

  constructor(
    @InjectRepository(SponsoredItem) private readonly sponsoredRepo: Repository<SponsoredItem>,
  ) {}

  private async loadPool(): Promise<SponsoredProductView[]> {
    if (this.poolCache && this.poolCache.expiresAt > Date.now()) {
      return this.poolCache.items;
    }

    const now = new Date();
    const rows = await this.sponsoredRepo
      .createQueryBuilder('s')
      .innerJoin(Product, 'p', 'p.id = s.product_id')
      .select(CONSTANTS.SPONSOR_FIELD_PROJECTION)
      .where('s.is_active = true')
      .andWhere('p.is_active = true')
      .andWhere('(s.starts_at IS NULL OR s.starts_at <= :now)', { now })
      .andWhere('(s.ends_at IS NULL OR s.ends_at >= :now)', { now })
      .orderBy('s.priority', 'DESC')
      .addOrderBy('p.id', 'ASC')
      .getRawMany();

    const items: SponsoredProductView[] = rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      description: r.description,
      price: r.price,
      currency: r.currency,
      imageUrl: r.imageUrl,
      categoryId: r.categoryId,
      isSponsored: true,
      sponsoredLabel: 'Sponsored',
    }));

    this.poolCache = { items, expiresAt: Date.now() + this.poolTtlMs };
    return items;
  }

  async getForSlot(slotNumber: number): Promise<SponsoredProductView | null> {
    const pool = await this.loadPool();
    if (pool.length === 0) return null;
    return pool[(slotNumber - 1) % pool.length];
  }

  async getManyForSlots(slotNumbers: number[]): Promise<Map<number, SponsoredProductView>> {
    const pool = await this.loadPool();
    const result = new Map<number, SponsoredProductView>();
    if (pool.length === 0) return result;
    for (const slotNumber of slotNumbers) {
      result.set(slotNumber, pool[(slotNumber - 1) % pool.length]);
    }
    return result;
  }
}
