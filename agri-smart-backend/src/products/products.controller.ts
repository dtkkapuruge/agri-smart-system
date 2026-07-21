import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SetPriceDto } from './dto/set-price.dto';

@Controller('products') // All routes start with /products
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // POST /products - Add a new vegetable
  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  // GET /products - See all vegetables
  @Get()
  async getAllProducts() {
    return this.productsService.getAllProducts();
  }

  // GET /products/:id - See one specific vegetable
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  // POST /products/:id/price - Set the price for a vegetable
  @Post(':id/price')
  async setMarketPrice(@Param('id') id: string, @Body() dto: SetPriceDto) {
    return this.productsService.setMarketPrice(id, dto);
  }
}
