import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('farmer/stats/:farmerId')
  async getFarmerStats(@Param('farmerId') farmerId: string) {
    return this.dashboardService.getFarmerStats(farmerId);
  }

  @Get('buyer/stats/:buyerId')
  async getBuyerStats(@Param('buyerId') buyerId: string) {
    return this.dashboardService.getBuyerStats(buyerId);
  }
}
