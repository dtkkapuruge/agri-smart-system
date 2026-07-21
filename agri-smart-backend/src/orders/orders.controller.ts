import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@Controller('orders')
@UseGuards(SupabaseAuthGuard) // 🔒 This protects ALL routes below
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /orders - Create a new request
  @Post()
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    // req.user.id comes from the Supabase token
    return this.ordersService.createOrder(req.user.id, dto);
  }

  // GET /orders/my-orders - A buyer sees their own requests
  @Get('my-orders')
  async getMyOrders(@Req() req: any) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  // GET /orders/available - Farmers see all pending requests
  @Get('available')
  async getAvailableOrders() {
    return this.ordersService.getAvailableOrders();
  }
}
