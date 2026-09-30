import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity()
export class CartItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() sessionId: string;
  @Column() productId: string;
  @Column({ nullable: true }) variantTitle: string;
  @Column('int', { default: 1 }) qty: number;
  @Column('simple-json', { nullable: true }) properties: Record<string, string>;
  // Snapshot of the product at add-to-bag time, so the bag can still show
  // real title/price/image even if the product lookup fails (e.g. stale id).
  @Column({ nullable: true }) title: string;
  @Column('int', { nullable: true }) priceCents: number;
  @Column({ nullable: true }) image: string;
  @Column({ nullable: true }) slug: string;
  @CreateDateColumn() createdAt: Date;
}
