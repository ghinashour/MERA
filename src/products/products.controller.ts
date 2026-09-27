import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private svc: ProductsService) {}
  @Get('products') list(@Query('q') q?: string) { return this.svc.list(q); }
  @Get('products/:slug') bySlug(@Param('slug') slug: string) { return this.svc.getBySlug(slug); }
  @Post('admin/products') create(@Body() dto: any) { return this.svc.create(dto); }
  @Patch('admin/products/:id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete('admin/products/:id') remove(@Param('id') id: string) { return this.svc.remove(id); }
  @Get('collections') cols() { return this.svc.listCollections(); }
}
