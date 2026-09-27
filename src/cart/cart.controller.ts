import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';

@Controller('cart')
export class CartController {
  constructor(@InjectRepository(CartItem) private cart: Repository<CartItem>, @InjectRepository(Product) private products: Repository<Product>) {}
  // Enriched with product title/price/image so the bag shows real items, not raw IDs.
  private async withProducts(items: CartItem[]) {
    const ids = [...new Set(items.map((i) => i.productId))];
    const prods = ids.length ? await this.products.find({ where: { id: In(ids) } }) : [];
    const byId = new Map(prods.map((p) => [p.id, p]));
    return items.map((i) => {
      const p = byId.get(i.productId);
      return { ...i, title: p?.title || 'Item', priceCents: p?.priceCents ?? 0, image: p?.images?.[0] || null, slug: p?.slug || null, stock: p?.stock ?? 0 };
    });
  }
  @Get() async list(@Headers('x-session-id') sid = 'anon') { return this.withProducts(await this.cart.find({ where: { sessionId: sid } })); }
  @Post('add') async add(@Headers('x-session-id') sid = 'anon', @Body() b: { productId: string; qty?: number; variantTitle?: string; properties?: any }) {
    const existing = await this.cart.findOne({ where: { sessionId: sid, productId: b.productId } });
    if (existing && JSON.stringify(existing.properties || {}) === JSON.stringify(b.properties || {})) {
      existing.qty += b.qty ?? 1;
      return this.cart.save(existing);
    }
    return this.cart.save(this.cart.create({ sessionId: sid, productId: b.productId, qty: b.qty ?? 1, variantTitle: b.variantTitle, properties: b.properties }));
  }
  @Delete('clear/all') clear(@Headers('x-session-id') sid = 'anon') { return this.cart.delete({ sessionId: sid }); }
  @Delete('clear') clearOld(@Headers('x-session-id') sid = 'anon') { return this.cart.delete({ sessionId: sid }); }
  @Patch(':id') async update(@Param('id') id: string, @Body() b: { qty: number }) {
    if (b.qty <= 0) { await this.cart.delete(id); return { removed: true }; }
    await this.cart.update(id, { qty: b.qty });
    return this.cart.findOne({ where: { id } });
  }
  @Delete(':id') remove(@Param('id') id: string) { return this.cart.delete(id); }
  @Get('count/summary') async count(@Headers('x-session-id') sid = 'anon', @Query() _q: any) {
    const items = await this.withProducts(await this.cart.find({ where: { sessionId: sid } }));
    return { count: items.reduce((a, b) => a + b.qty, 0), items };
  }
}
