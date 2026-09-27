import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber, Post, Review, Message } from '../content/content.entity';
import { Order, OrderItem } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber, Post, Review, Message, Order, OrderItem, Product, User])],
  controllers: [AdminController],
})
export class AdminModule {}
