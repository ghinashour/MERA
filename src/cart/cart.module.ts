import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { CartController } from './cart.controller';

@Module({ imports: [TypeOrmModule.forFeature([CartItem, Product])], controllers: [CartController] })
export class CartModule {}
