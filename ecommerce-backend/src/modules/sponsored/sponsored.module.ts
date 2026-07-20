import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SponsoredItem } from './entities/sponsored-item.entity';
import { SponsoredService } from './sponsored.service';

@Module({
  imports: [TypeOrmModule.forFeature([SponsoredItem])],
  providers: [SponsoredService],
  exports: [SponsoredService],
})
export class SponsoredModule {}
