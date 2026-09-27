import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem } from './order.entity';
import { Product } from '../products/product.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({ imports: [TypeOrmModule.forFeature([Order, OrderItem, Product])], controllers: [OrdersController], providers: [OrdersService] })
export class OrdersModule {}
