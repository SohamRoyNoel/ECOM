import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SponsoredModule } from '../sponsored/sponsored.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), SponsoredModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
