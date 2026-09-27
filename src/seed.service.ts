import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Product } from './products/product.entity';
import { Collection } from './products/collection.entity';
import { Post } from './content/content.entity';
import { User } from './users/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Collection) private collections: Repository<Collection>,
    @InjectRepository(Post) private posts: Repository<Post>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}
  async onModuleInit() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mera.shop';
    if (!(await this.users.findOne({ where: { email: adminEmail } }))) {
      const password = process.env.ADMIN_PASSWORD || 'MeraAdmin123!';
      await this.users.save(
        this.users.create({ email: adminEmail, passwordHash: await bcrypt.hash(password, 10), role: 'admin' }),
      );
      // eslint-disable-next-line no-console
      console.log(`Admin seeded: ${adminEmail}`);
    }
    if ((await this.products.count()) === 0) {
      const seed = [
        { title: 'Linen Journal', slug: 'linen-journal', priceCents: 2800, images: ['/public/product-journal.png'], stock: 100 },
        { title: 'Stoneware Mug', slug: 'stoneware-mug', priceCents: 2400, images: ['/public/product-mug.png'], stock: 100 },
        { title: 'Silk Scarf', slug: 'silk-scarf', priceCents: 6800, images: ['/public/product-scarf.png'], stock: 100 },
        { title: 'Scented Candle', slug: 'scented-candle', priceCents: 3600, images: ['/public/product-candle.png'], stock: 100 },
      ];
      for (const s of seed) await this.products.save(this.products.create({ ...s, description: s.title, currency: 'USD', active: true } as any));
    }
    if ((await this.collections.count()) === 0) {
      for (const h of [{ title: 'New Arrivals', handle: 'new-arrivals' }, { title: 'For the Desk', handle: 'desk' }, { title: 'For the Home', handle: 'home' }])
        await this.collections.save(this.collections.create(h as any));
    }
    if ((await this.posts.count()) === 0) {
      await this.posts.save(this.posts.create({ title: 'A calmer way of living', slug: 'calmer-living', body: 'Small objects, brighter days. How MERA curates for intentional everyday.', image: '/story.png' } as any));
    }
  }
}
