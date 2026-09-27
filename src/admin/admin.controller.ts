import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { Subscriber, Message } from '../content/content.entity';
import { User } from '../users/user.entity';

// Analyst workspace: overview + revenue + orders/payments + stock/products.
@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(OrderItem) private items: Repository<OrderItem>,
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Subscriber) private subs: Repository<Subscriber>,
    @InjectRepository(Message) private msgs: Repository<Message>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}
  @Get('stats') async stats() {
    const orders = await this.orders.find({ relations: ['items'], order: { createdAt: 'DESC' } });
    const live = orders.filter((o) => o.status !== 'cancelled');
    const revenue = live.reduce((a, o) => a + (o.totalCents || 0), 0);
    const byStatus: Record<string, number> = {};
    const byPay: Record<string, { orders: number; revenue: number }> = {};
    const byDay: Record<string, { orders: number; revenue: number }> = {};
    const byMonth: Record<string, { orders: number; revenue: number }> = {};
    for (const o of orders) {
      byStatus[o.status || 'unknown'] = (byStatus[o.status || 'unknown'] || 0) + 1;
      const pm = o.payMethod || 'unknown';
      byPay[pm] = byPay[pm] || { orders: 0, revenue: 0 };
      byPay[pm].orders += 1;
      if (o.status !== 'cancelled') byPay[pm].revenue += o.totalCents || 0;
      // Guard invalid/missing dates (Invalid Date.toISOString() would 500 the whole dashboard)
      const dt = o.createdAt ? new Date(o.createdAt) : null;
      const t = dt && !Number.isNaN(dt.getTime()) ? dt : null;
      const d = t ? t.toISOString().slice(0, 10) : 'unknown-date';
      byDay[d] = byDay[d] || { orders: 0, revenue: 0 };
      byDay[d].orders += 1;
      if (o.status !== 'cancelled') byDay[d].revenue += o.totalCents || 0;
      const m = t ? t.toISOString().slice(0, 7) : 'unknown-month';
      byMonth[m] = byMonth[m] || { orders: 0, revenue: 0 };
      byMonth[m].orders += 1;
      if (o.status !== 'cancelled') byMonth[m].revenue += o.totalCents || 0;
    }
    // Funnel: paid-ish vs pending vs cancelled
    const paidStates = ['confirmed', 'shipped', 'delivered', 'paid'];
    const funnel = {
      paid: orders.filter((o) => paidStates.includes(o.status)).length,
      pending: orders.filter((o) => ['pending', 'pending-confirmation', 'awaiting-paypal'].includes(o.status)).length,
      cancelled: byStatus['cancelled'] || 0,
    };
    // Customers: spend + frequency by email
    const cust: Record<string, { orders: number; revenue: number }> = {};
    for (const o of live) {
      const email = o.email || 'unknown';
      cust[email] = cust[email] || { orders: 0, revenue: 0 };
      cust[email].orders += 1;
      cust[email].revenue += o.totalCents || 0;
    }
    const customers = Object.entries(cust).map(([email, v]) => ({ email, ...v })).sort((a, b) => b.revenue - a.revenue);
    const repeat = customers.filter((c) => c.orders > 1).length;
    // Products: sales + stock value + dead stock
    const prodSales: Record<string, { title: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      for (const i of o.items || []) {
        if (!i?.productId) continue;
        const cur = prodSales[i.productId] || { title: i.title || i.productId, qty: 0, revenue: 0 };
        cur.qty += i.qty || 1;
        cur.revenue += (i.priceCents || 0) * (i.qty || 1);
        prodSales[i.productId] = cur;
      }
    }
    const products = await this.products.find({ order: { stock: 'ASC' } });
    const fullProducts = products.map((p) => {
      const s = prodSales[p.id] || { qty: 0, revenue: 0 };
      return { id: p.id, title: p.title, slug: p.slug, priceCents: p.priceCents, stock: p.stock, active: (p as any).active, soldQty: s.qty, soldRevenue: s.revenue, stockValue: (p.priceCents || 0) * (p.stock || 0) };
    });
    const topProducts = Object.entries(prodSales).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const deadStock = fullProducts.filter((p) => !p.soldQty);
    const stockValue = fullProducts.reduce((a, p) => a + p.stockValue, 0);
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 5).map((p) => ({ id: p.id, title: p.title, slug: p.slug, stock: p.stock }));
    const outOfStock = products.filter((p) => (p.stock ?? 0) <= 0).length;
    const days = Object.entries(byDay).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-14).map(([day, v]) => ({ day, ...v }));
    const months = Object.entries(byMonth).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-6).map(([month, v]) => ({ month, ...v }));
    const bestDay = days.reduce((b, d) => (d.revenue > (b?.revenue || 0) ? d : b), days[0] || null);
    return {
      kpis: {
        orders: orders.length,
        revenueCents: revenue,
        avgOrderCents: live.length ? Math.round(revenue / live.length) : 0,
        subscribers: await this.subs.count(),
        messages: await this.msgs.count(),
        customers: customers.length,
        repeatCustomers: repeat,
        products: products.length,
        lowStockCount: lowStock.length,
        outOfStock,
        stockValueCents: stockValue,
        deadStockCount: deadStock.length,
        cancelRate: orders.length ? Number((((byStatus['cancelled'] || 0) / orders.length) * 100).toFixed(1)) : 0,
        paypalShare: orders.length ? Number((((byPay['paypal']?.orders || 0) / orders.length) * 100).toFixed(1)) : 0,
        codShare: orders.length ? Number((((byPay['cod']?.orders || 0) / orders.length) * 100).toFixed(1)) : 0,
      },
      byStatus, byPay, funnel, days, months, bestDay, topProducts, lowStock, fullProducts, deadStock, topCustomers: customers.slice(0, 10),
      recent: orders.slice(0, 20).map((o) => ({ id: o.id, email: o.email, totalCents: o.totalCents, payMethod: o.payMethod, status: o.status, createdAt: o.createdAt, items: (o.items || []).length, shipping: o.shipping })),
    };
  }
  @Get('orders') async ordersList(@Query('status') status?: string, @Query('pay') pay?: string, @Query('limit') limit?: string) {
    const all = await this.orders.find({ relations: ['items'], order: { createdAt: 'DESC' } });
    return all
      .filter((o) => (!status || o.status === status) && (!pay || o.payMethod === pay))
      .slice(0, Math.min(Number(limit) || 200, 500))
      .map((o) => ({ id: o.id, email: o.email, totalCents: o.totalCents, payMethod: o.payMethod, status: o.status, createdAt: o.createdAt, items: (o.items || []).map((i) => ({ title: i.title, qty: i.qty, priceCents: i.priceCents })), shipping: o.shipping }));
  }
  @Get('products') prods() {
    return this.products.find({ order: { title: 'ASC' } });
  }
  @Patch('products/:id/stock') async adjust(@Param('id') id: string, @Body() b: { stock?: number; delta?: number }) {
    const p = await this.products.findOne({ where: { id } });
    if (!p) return { ok: false, error: 'not found' };
    p.stock = typeof b.stock === 'number' ? b.stock : (p.stock || 0) + (b.delta || 0);
    if (p.stock < 0) p.stock = 0;
    await this.products.save(p);
    return { ok: true, id: p.id, stock: p.stock };
  }
  @Get('subscribers') subsList() { return this.subs.find({ order: { createdAt: 'DESC' } }); }
}
