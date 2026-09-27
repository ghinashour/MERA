import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Collection } from './collection.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column() slug: string;
  @Column('text', { nullable: true }) description: string;
  @Column('int') priceCents: number;
  @Column('int', { default: 0 }) compareAtCents: number;
  @Column({ default: 'USD' }) currency: string;
  @Column({ default: true }) active: boolean;
  @Column('simple-json', { nullable: true }) images: string[];
  @Column('simple-json', { nullable: true }) variants: { title: string; priceCents?: number; sku?: string; stock?: number }[];
  @Column('int', { default: 0 }) stock: number;
  @Column({ nullable: true }) sku: string;
  @ManyToMany(() => Collection, (c) => c.products, { cascade: false })
  @JoinTable() collections: Collection[];
}
