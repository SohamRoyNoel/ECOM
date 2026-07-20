import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Product id must be a positive integer.');
    }
    return this.productsService.findById(id);
  }

  @Get()
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findPage(query);
  }
}
