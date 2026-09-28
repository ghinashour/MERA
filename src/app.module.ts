import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { Product } from './products/product.entity';
import { Collection } from './products/collection.entity';
import { User } from './users/user.entity';
import { CartItem } from './cart/cart-item.entity';
import { Order, OrderItem } from './orders/order.entity';
import { Subscriber, Post, Review, Message } from './content/content.entity';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadModule } from './upload/upload.module';
import { ContentModule } from './content/content.module';
import { AdminModule } from './admin/admin.module';
import { HealthController, RootController } from './health.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...(process.env.DATABASE_URL
        ? {
            type: 'postgres' as const,
            url: process.env.DATABASE_URL,
            // Managed free Postgres (Neon/Supabase) requires SSL. Set DB_SSL=off
            // only for a local Postgres without SSL.
            ssl: process.env.DB_SSL === 'off' ? false : { rejectUnauthorized: false },
          }
        : { type: 'sqljs' as const }),
      entities: [Product, Collection, User, CartItem, Order, OrderItem, Subscriber, Post, Review, Message],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'public'), serveRoot: '/public' }),
    TypeOrmModule.forFeature([Product, Collection, Post, User]),
    ProductsModule,
    AuthModule,
    UsersModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    UploadModule,
    ContentModule,
    AdminModule,
  ],
  controllers: [RootController, HealthController],
  providers: [SeedService],
})
export class AppModule {}
