import { Controller, Post, Body, Param } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // Endpoint to generate the OTP (usually called automatically after payment)
  @Post('start/:orderId')
  async startDelivery(@Param('orderId') orderId: string) {
    return this.deliveryService.createDelivery(orderId);
  }

  // Endpoint for the Farmer to enter the OTP
  @Post('verify/:orderId')
  async verify(@Param('orderId') orderId: string, @Body('otp') otp: string) {
    return this.deliveryService.verifyDelivery(orderId, otp);
  }
}
