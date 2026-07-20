import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity({ name: 'products' })
@Index(['categoryId', 'id'])
export class Product {

  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 300 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  sku!: string;

  @Column({ name: 'category_id', type: 'int' })
  categoryId!: number;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @Column({ type: 'char', length: 3, default: 'USD' })
  currency!: string;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity!: number;

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({
    name: 'search_vector',
    type: 'tsvector',
    select: false,
    insert: false,
    update: false,
  })
  searchVector!: string;
}
