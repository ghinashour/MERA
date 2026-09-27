import { DataSource } from 'typeorm';
import { Product } from './products/product.entity';
import { Collection } from './products/collection.entity';

async function main() {
  const db = new DataSource({
    ...(process.env.DATABASE_URL
      ? { type: 'postgres' as const, url: process.env.DATABASE_URL }
      : { type: 'sqljs' as const }),
    entities: [Product, Collection],
    synchronize: true,
  });
  await db.initialize();
  const products = db.getRepository(Product);
  const collections = db.getRepository(Collection);
  const seed = [
    { title: 'Linen Journal', slug: 'linen-journal', priceCents: 2800, images: ['/public/product-journal.png'], stock: 100 },
    { title: 'Stoneware Mug', slug: 'stoneware-mug', priceCents: 2400, images: ['/public/product-mug.png'], stock: 100 },
    { title: 'Silk Scarf', slug: 'silk-scarf', priceCents: 6800, images: ['/public/product-scarf.png'], stock: 100 },
    { title: 'Scented Candle', slug: 'scented-candle', priceCents: 3600, images: ['/public/product-candle.png'], stock: 100 },
  ];
  for (const s of seed) {
    if (!(await products.findOne({ where: { slug: s.slug } }))) await products.save(products.create({ ...s, description: s.title, currency: 'USD', active: true } as any));
  }
  for (const h of [{ title: 'New Arrivals', handle: 'new-arrivals' }, { title: 'For the Desk', handle: 'desk' }, { title: 'For the Home', handle: 'home' }]) {
    if (!(await collections.findOne({ where: { handle: h.handle } }))) await collections.save(collections.create(h as any));
  }
  console.log('seed done');
  await db.destroy();
}
main();
