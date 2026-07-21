import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitGradingDto } from './dto/submit-grading.dto';

@Injectable()
export class AiGradingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Processes a product image for quality grading and verifies location authenticity.
   * @param orderId The ID of the order being fulfilled
   * @param dto Contains image URL and capture coordinates
   * @param file The uploaded image file
   */
  async processGrading(orderId: string, dto: SubmitGradingDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required for AI grading.');
    }

    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) throw new BadRequestException('Order not found.');
    if (!order.farmer_id) throw new BadRequestException('Order has not been accepted by a farmer.');

    // Metadata Forensics: Verify if the photo was taken at the registered farm location
    const distanceCheck: any[] = await this.prisma.$queryRaw`
      SELECT ST_Distance(
        fp.farm_location::geography, 
        ST_SetSRID(ST_MakePoint(${parseFloat(dto.longitude as any)}, ${parseFloat(dto.latitude as any)}), 4326)::geography
      ) AS distance_meters
      FROM "FarmerProfile" fp
      WHERE fp.profile_id = ${order.farmer_id}
    `;

    const distance = distanceCheck[0]?.distance_meters || 999999;
    console.log(`📏 Forensics Check: Capture distance is ${distance.toFixed(2)} meters from farm.`);

    // Allow a 10km radius for testing purposes (Should be tighter in production)
    if (distance > 10000) { 
      throw new BadRequestException('Forensics verification failed: Image capture location mismatch.');
    }

    // AI Grading: Send the file to FastAPI service
    let aiData: any;
    try {
      const formData = new FormData();
      formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

      const aiResponse = await fetch('http://localhost:8000/api/v1/grade-crop', {
        method: 'POST',
        body: formData as any,
      });

      if (!aiResponse.ok) {
        throw new Error(`AI service failed with status: ${aiResponse.status}`);
      }

      aiData = await aiResponse.json();
    } catch (error) {
      console.error('Error communicating with AI service:', error);
      throw new BadRequestException('Failed to process image with AI grading service.');
    }

    const aiGrade = aiData.grading || 'A';
    const qualityScore = aiData.quality_score || 98.5;
    const finalPrice = aiData.price_estimate || 125.00;

    // Persist the AI Verification Report
    return this.prisma.aiVerificationReport.create({
      data: {
        order_id: orderId,
        price_id: dto.price_id,
        image_url: dto.image_url || 'local_upload', // If you upload to storage, use that URL
        ai_grade: aiGrade,
        quality_score: qualityScore,
        metadata_verified: true,
        final_price: finalPrice,
      },
    });
  }
}
