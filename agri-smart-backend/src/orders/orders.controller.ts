import { Controller, Post, Get, Body, Req, Param, UseGuards } from '@nestjs/common';
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
    // req.user comes from SupabaseAuthGuard
    return this.ordersService.createOrder(req.user.id, req.user.email, req.user.user_metadata?.role || 'BUYER', dto);
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

  // GET /orders/farmer-matched/:farmerId - Farmer sees incoming matched orders
  @Get('farmer-matched/:farmerId')
  async getFarmerMatchedOrders(@Param('farmerId') farmerId: string) {
    return this.ordersService.getFarmerMatchedOrders(farmerId);
  }

  // GET /orders/farmer-accepted/:farmerId - Farmer sees orders they have accepted (status = MATCHED/ACCEPTED)
  @Get('farmer-accepted/:farmerId')
  async getFarmerAcceptedOrders(@Param('farmerId') farmerId: string) {
    return this.ordersService.getFarmerAcceptedOrders(farmerId);
  }

  // POST /orders/matched/:matchId/respond - Farmer accepts or rejects matched order
  @Post('matched/:matchId/respond')
  async respondToMatchedOrder(
    @Param('matchId') matchId: string,
    @Body() body: { action: string },
  ) {
    return this.ordersService.respondToMatchedOrder(matchId, body.action);
  }
}
