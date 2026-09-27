import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Collection } from './collection.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Collection) private collections: Repository<Collection>,
  ) {}
  list(q?: string) {
    const qb = this.products.createQueryBuilder('p').leftJoinAndSelect('p.collections', 'c');
    const term = (q || '').trim().toLowerCase();
    if (term) {
      // Escape LIKE wildcards so "100%" doesn't match everything; search title + description + slug.
      const esc = term.replace(/[\\%_]/g, (m) => `\\${m}`);
      // COALESCE guards NULL descriptions (sql.js + postgres safe)
      qb.where(
        `LOWER(p.title) LIKE :q ESCAPE '\\' OR LOWER(COALESCE(p.description, '')) LIKE :q ESCAPE '\\' OR LOWER(p.slug) LIKE :q ESCAPE '\\'`,
        {
          q: `%${esc}%`,
        },
      );
    }
    return qb.orderBy('p.title', 'ASC').getMany();
  }
  async getBySlug(slug: string) {
    const p = await this.products.findOne({ where: { slug }, relations: ['collections'] });
    if (!p) throw new NotFoundException(`product "${slug}" not found`);
    return p;
  }
  create(dto: Partial<Product>) { return this.products.save(this.products.create(dto)); }
  async update(id: string, dto: Partial<Product>) { await this.products.update(id, dto as any); return this.products.findOne({ where: { id } }); }
  remove(id: string) { return this.products.delete(id); }
  listCollections() { return this.collections.find({ relations: ['products'] }); }
}
