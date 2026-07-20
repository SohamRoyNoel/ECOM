import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160, unique: true })
  slug!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
