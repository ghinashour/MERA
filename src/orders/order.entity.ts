import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from 'typeorm';
export type PayMethod = 'paypal' | 'cod';
@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() email: string;
  @Column({ type: 'varchar', default: 'paypal' }) payMethod: PayMethod;
  @Column({ default: 'pending' }) status: string;
  @Column('int') totalCents: number;
  @Column('simple-json', { nullable: true }) shipping: any;
  @Column('simple-json', { nullable: true }) gift: any;
  @Column({ nullable: true }) paypalOrderId: string;
  @CreateDateColumn() createdAt: Date;
  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true }) items: OrderItem[];
}
@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' }) order: Order;
  @Column() productId: string;
  @Column() title: string;
  @Column('int') priceCents: number;
  @Column('int', { default: 1 }) qty: number;
  @Column('simple-json', { nullable: true }) properties: any;
}
