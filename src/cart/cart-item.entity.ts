import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity()
export class CartItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() sessionId: string;
  @Column() productId: string;
  @Column({ nullable: true }) variantTitle: string;
  @Column('int', { default: 1 }) qty: number;
  @Column('simple-json', { nullable: true }) properties: Record<string, string>;
  @CreateDateColumn() createdAt: Date;
}
