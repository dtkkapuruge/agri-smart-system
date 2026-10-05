import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ListingsService } from './listings.service';
import { AiGradingService } from '../ai-grading/ai-grading.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly aiGradingService: AiGradingService,
  ) {}

  @Get()
  getAllListings() {
    return this.listingsService.getAllListings();
  }

  @Get('farmer/:farmerId')
  getFarmerListings(@Param('farmerId') farmerId: string) {
    return this.listingsService.getFarmerListings(farmerId);
  }

  @Post('grade-and-list')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async createListing(
    @Body() dto: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    // Debug: log incoming body fields
    console.log('[grade-and-list] Incoming body fields:', {
      product_id: dto.product_id,
      productId: dto.productId,
      vegetableType: dto.vegetableType,
      quantity: dto.quantity,
      farmer_id: dto.farmer_id,
      farmerId: dto.farmerId,
      reqUser: req.user,
    });

    // Map frontend fields to what service expects
    const processDto = {
      ...dto,
      farmer_id: dto.farmer_id || dto.farmerId || (req.user && (req.user.sub || req.user.id)),
      product_id: dto.product_id || dto.productId || dto.vegetableType,
      quantity: dto.quantity,
    };

    console.log('[grade-and-list] Resolved processDto:', processDto);

    if (!processDto.product_id) {
      throw new BadRequestException('product_id is required.');
    }

    return this.aiGradingService.processIndependentListing(processDto, file);
  }

  /**
   * POST /listings/:listingId/order
   * Buyer places an order from a farmer's listing.
   * Creates a PENDING order and notifies the farmer via MatchingLog.
   */
  @Post(':listingId/order')
  @UseGuards(SupabaseAuthGuard)
  async placeOrder(
    @Param('listingId') listingId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    // Prefer the authenticated user's ID over whatever is in the body
    const buyer_id = req.user?.id ?? body.buyer_id;
    return this.listingsService.placeOrderFromListing(listingId, {
      ...body,
      buyer_id,
    });
  }
}
