import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'sponsored_items' })
export class SponsoredItem {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Index()
  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  /** Higher priority items are rotated in first. */
  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt!: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
