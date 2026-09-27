import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}
  @Get() list(@Query('email') email?: string) { return this.svc.list(email); }
  @Get(':id') one(@Param('id') id: string) { return this.svc.one(id); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Patch(':id/status') status(@Param('id') id: string, @Body() b: { status: string }) { return this.svc.setStatus(id, b.status); }
}
