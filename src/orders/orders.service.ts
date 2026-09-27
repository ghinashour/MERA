import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem } from './order.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService {
  constructor(@InjectRepository(Order) private orders: Repository<Order>, @InjectRepository(Product) private products: Repository<Product>) {}
  list(email?: string) {
    return this.orders.find({ where: email ? { email } : {}, relations: ['items'], order: { createdAt: 'DESC' } });
  }
  async one(id: string) {
    const o = await this.orders.findOne({ where: { id }, relations: ['items'] });
    if (!o) throw new NotFoundException('order not found');
    return o;
  }
  async create(dto: { email: string; payMethod: 'paypal' | 'cod'; items: { productId: string; qty: number; properties?: any }[]; shipping?: any; gift?: any }) {
    if (!dto.email?.includes('@')) throw new BadRequestException('valid email required');
    if (!dto.items?.length) throw new BadRequestException('empty order');
    let total = 0;
    const items: Partial<OrderItem>[] = [];
    for (const li of dto.items) {
      const p = await this.products.findOne({ where: { id: li.productId } });
      if (!p) throw new BadRequestException(`product ${li.productId} not found`);
      if (p.stock < li.qty) throw new BadRequestException(`${p.title} only ${p.stock} left`);
      total += p.priceCents * li.qty;
      items.push({ productId: p.id, title: p.title, priceCents: p.priceCents, qty: li.qty, properties: { ...li.properties, ...(dto.gift || {}) } });
    }
    if (dto.gift?.packaging === 'Keepsake box') total += 1200;
    if (dto.gift?.packaging === 'Linen pouch') total += 600;
    const order = await this.orders.save(this.orders.create({
      email: dto.email, payMethod: dto.payMethod, totalCents: total,
      shipping: dto.shipping, gift: dto.gift,
      status: dto.payMethod === 'cod' ? 'pending-confirmation' : 'awaiting-paypal',
      items: items as any,
    }));
    // decrement stock
    for (const li of dto.items) {
      const p = await this.products.findOne({ where: { id: li.productId } });
      if (p) { p.stock -= li.qty; await this.products.save(p); }
    }
    return order;
  }
  async setStatus(id: string, status: string) {
    await this.orders.update(id, { status });
    return this.one(id);
  }
}
