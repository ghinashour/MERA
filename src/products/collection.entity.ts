import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Collection {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ unique: true }) handle: string;
  @Column('text', { nullable: true }) description: string;
  @Column({ nullable: true }) image: string;
  @ManyToMany(() => Product, (p) => p.collections) products: Product[];
}
