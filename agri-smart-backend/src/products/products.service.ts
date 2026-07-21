import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SetPriceDto } from './dto/set-price.dto';

@Injectable()
export class ProductsService {
  // We inject PrismaService so we can talk to the database
  constructor(private prisma: PrismaService) {}

  // 1. Create a new product
  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        image_url: dto.image_url,
      },
    });
  }

  // 2. Get all products
  async getAllProducts() {
    return this.prisma.product.findMany();
  }

  // 3. Get one specific product
  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: id },
    });
    
    if (!product) {
      throw new NotFoundException('Product not found!');
    }
    return product;
  }

  // 4. Set the HARTI base price for a product
  async setMarketPrice(productId: string, dto: SetPriceDto) {
    // First, check if the product exists
    await this.getProductById(productId);

    return this.prisma.marketPrice.create({
      data: {
        product_id: productId,
        harti_base_price: dto.harti_base_price,
      },
    });
  }
}
