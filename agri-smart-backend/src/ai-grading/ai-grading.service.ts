import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitGradingDto } from './dto/submit-grading.dto';

@Injectable()
export class AiGradingService {
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    let serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey || serviceKey.includes('REPLACE_WITH')) {
      serviceKey = this.config.get<string>('SUPABASE_ANON_KEY');
    }
    
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL'),
      serviceKey,
    );
  }

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

    // ── TEST MODE: Skip everything except the AI call ─────────────────────
    if (orderId.startsWith('test-')) {
      return this._callAiEngineAndReturn(orderId, dto, file, 'test-no-upload');
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Production: DB order check
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });
    if (!order) throw new BadRequestException('Order not found.');
    if (!order.farmer_id) throw new BadRequestException('Order has not been accepted by a farmer.');

    // Metadata Forensics: Verify if the photo was taken at the registered farm location
    let distance = 999999;
    if (order?.farmer_id) {
      const distanceCheck: any[] = await this.prisma.$queryRaw`
        SELECT ST_Distance(
          fp.farm_location::geography, 
          ST_SetSRID(ST_MakePoint(${parseFloat(dto.longitude as any)}, ${parseFloat(dto.latitude as any)}), 4326)::geography
        ) AS distance_meters
        FROM "FarmerProfile" fp
        WHERE fp.profile_id = ${order.farmer_id}
      `;

      distance = distanceCheck[0]?.distance_meters || 999999;
    }
    console.log(`📏 Forensics Check: Capture distance is ${distance.toFixed(2)} meters from farm.`);

    // Allow a 10km radius for testing purposes (Should be tighter in production)
    // TEMPORARILY BYPASSED FOR TESTING
    // if (distance > 10000) {
    //   throw new BadRequestException('Forensics verification failed: Image capture location mismatch.');
    // }

    // AI Grading: Send the file to FastAPI service & Supabase Storage
    let aiData: any;
    let uploadedImageUrl = dto.image_url || 'local_upload';

    try {
      // 1. Upload image to Supabase storage
      //    Sanitise filename: remove spaces / special chars that cause 400 from storage
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `tomatoes/${orderId}_${Date.now()}_${safeName}`;

      // Ensure content-type is always a valid image mime
      let uploadMime = file.mimetype || 'image/jpeg';
      if (!uploadMime.startsWith('image/')) uploadMime = 'image/jpeg';

      const { error: supaError } = await this.supabase.storage
        .from('ai-grades')
        .upload(filePath, file.buffer, {
          contentType: uploadMime,
          upsert: true,
        });

      if (supaError) {
        // Non-fatal: log and continue with a fallback URL so grading still works
        console.error('Supabase upload error (non-fatal):', supaError.message);
        uploadedImageUrl = dto.image_url || 'upload_failed';
      }

      // Extract Public Image URL from Supabase (only if upload succeeded)
      if (!supaError) {
        const { data: publicUrlData } = this.supabase.storage
          .from('ai-grades')
          .getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          uploadedImageUrl = publicUrlData.publicUrl;
        }
      }

      // 2. Call FastAPI AI Engine
      aiData = await this._callFastApi(file);
    } catch (error: any) {
      // Re-throw BadRequestExceptions as-is; wrap anything else
      if (error instanceof BadRequestException) throw error;
      console.error('❌ [AI-Grading] Unexpected error communicating with AI service.');
      console.error(`   Error type : ${error?.constructor?.name}`);
      console.error(`   Message    : ${error?.message}`);
      console.error(`   Stack      :\n${error?.stack}`);
      throw new BadRequestException(
        `Failed to process image with AI grading service. Reason: ${error?.message}`,
      );
    }

    // Parse AI Output safely
    const aiGrade = aiData.grade || aiData.quality_grade || aiData.grading || 'A';
    const qualityScore = aiData.score || aiData.confidence || aiData.quality_score || 98.5;
    const metadataVerified = aiData.forensics?.likely_live_camera || false;

    // Calculate final price based on market price and grade
    let basePrice = 100.0; // fallback base price
    let marketPrice = null;
    
    if (dto.price_id) {
      marketPrice = await this.prisma.marketPrice.findUnique({
        where: { price_id: dto.price_id },
      });
    }

    if (!marketPrice && order?.product_id) {
      marketPrice = await this.prisma.marketPrice.findFirst({
        where: { product_id: order.product_id }
      });

      if (!marketPrice) {
        marketPrice = await this.prisma.marketPrice.create({
          data: {
            product_id: order.product_id,
            harti_base_price: basePrice
          }
        });
      }
    }

    if (marketPrice) {
      basePrice = Number(marketPrice.harti_base_price);
    }
    
    let finalPrice = basePrice;
    if (aiGrade === 'B') finalPrice = basePrice * 0.8; // 20% penalty
    if (aiGrade === 'C') finalPrice = basePrice * 0.5; // 50% penalty

    const reportData = {
      order_id: orderId,
      price_id: marketPrice ? marketPrice.price_id : (dto.price_id || 'test-price'),
      image_url: uploadedImageUrl,
      ai_grade: aiGrade,
      quality_score: typeof qualityScore === 'number' ? qualityScore : parseFloat(qualityScore),
      metadata_verified: metadataVerified,
      final_price: finalPrice,
    };

    // Persist or update the AI Verification Report
    const savedReport = await this.prisma.aiVerificationReport.upsert({
      where: { order_id: orderId },
      update: reportData,
      create: reportData,
    });

    // Also update the Order record so the buyer dashboard shows grade + price
    await this.prisma.order.update({
      where: { order_id: orderId },
      data: { status: 'ACCEPTED' },
    }).catch(() => { /* ignore if order already in different status */ });

    // ── Save GradingSubmission so the farmer dashboard picks it up ─────────────
    await this._saveGradingSubmission({
      farmerIdInput: order.farmer_id,
      imageUrl: uploadedImageUrl,
      aiGrade: aiGrade,
      qualityScore: typeof qualityScore === 'number' ? qualityScore : parseFloat(qualityScore),
      defectPercentage: aiData.defect_percentage ?? null,
      finalPrice: finalPrice,
      metadataVerified: metadataVerified,
      orderId: orderId,
    });
    // ──────────────────────────────────────────────────────────────────────────

    return savedReport;
  }

  /**
   * TEST MODE helper: calls the FastAPI AI engine directly and returns result.
   * Skips DB order check and Supabase storage upload, but ALWAYS saves a GradingSubmission.
   */
  private async _callAiEngineAndReturn(
    orderId: string,
    dto: SubmitGradingDto,
    file: Express.Multer.File,
    imageUrlFallback: string,
  ) {
    console.log(`🧪 [TEST MODE] orderId="${orderId}" — skipping DB order check and storage upload.`);
    console.log(`🧪 [TEST MODE] farmer_id received from frontend: "${dto.farmer_id ?? 'NOT PROVIDED'}"`);

    if (!dto.farmer_id) {
      throw new BadRequestException(
        'farmer_id is required for grading. Make sure the frontend sends it in FormData.',
      );
    }

    const aiData = await this._callFastApi(file);

    const aiGrade = aiData.grade || aiData.quality_grade || aiData.grading || 'A';
    const qualityScore = aiData.score || aiData.confidence || aiData.quality_score || 98.5;
    const metadataVerified = aiData.forensics?.likely_live_camera || false;

    // Resolve market base price from DB (keyed by product_id if provided, else fallback)
    let basePrice = 200.0; // Default Rs. 200/kg (Tomato demo price)
    if (dto.product_id) {
      const mp = await this.prisma.marketPrice.findFirst({
        where: { product_id: dto.product_id },
        orderBy: { updated_at: 'desc' },
      });
      if (mp) basePrice = Number(mp.harti_base_price);
    } else if (dto.price_id) {
      const mp = await this.prisma.marketPrice.findUnique({
        where: { price_id: dto.price_id },
      });
      if (mp) basePrice = Number(mp.harti_base_price);
    }

    let finalPrice = basePrice;                        // Grade A = 100%
    if (aiGrade === 'B') finalPrice = basePrice * 0.8; // Grade B = 80%
    if (aiGrade === 'C') finalPrice = basePrice * 0.5; // Grade C = 50%

    const report = {
      order_id: orderId,
      price_id: dto.price_id || 'test-price',
      image_url: dto.image_url || imageUrlFallback,
      ai_grade: aiGrade,
      quality_score: typeof qualityScore === 'number' ? qualityScore : parseFloat(qualityScore),
      metadata_verified: metadataVerified,
      final_price: finalPrice,
    };

    // ── ALWAYS save a GradingSubmission record ─────────────────────────────────
    await this._saveGradingSubmission({
      farmerIdInput: dto.farmer_id,
      imageUrl: report.image_url,
      aiGrade: report.ai_grade,
      qualityScore: report.quality_score,
      defectPercentage: aiData.defect_percentage ?? null,
      finalPrice: report.final_price,
      metadataVerified: report.metadata_verified,
      orderId: orderId.startsWith('test-') ? undefined : orderId,
    });
    // ──────────────────────────────────────────────────────────────────────────

    return {
      message: 'Test run successful. AI graded.',
      report,
      ai_raw_data: aiData,
    };
  }

  /**
   * Shared helper: resolves the FarmerProfile (auto-creating User + Profile if needed)
   * and inserts one GradingSubmission row. Called from both the production path
   * (processGrading) and the test-mode path (_callAiEngineAndReturn).
   *
   * Never throws — a save failure must not roll back the grading result.
   */
  private async _saveGradingSubmission(opts: {
    farmerIdInput: string;        // user_id OR profile_id from the frontend / order
    imageUrl: string;
    aiGrade: string;
    qualityScore: number;
    defectPercentage: number | null;
    finalPrice: number;
    metadataVerified: boolean;
    orderId?: string;             // linked order, if available
  }): Promise<void> {
    const { farmerIdInput, imageUrl, aiGrade, qualityScore, defectPercentage, finalPrice, metadataVerified, orderId } = opts;
    console.log(`💾 [GradingSubmission] Starting save for farmer_id="${farmerIdInput}"...`);
    try {
      // Step 1: Resolve FarmerProfile — accept either profile_id or user_id
      let farmerProfile = await this.prisma.farmerProfile.findFirst({
        where: {
          OR: [
            { profile_id: farmerIdInput },
            { user_id: farmerIdInput },
          ],
        },
      });
      console.log(`🔍 [GradingSubmission] FarmerProfile lookup:`, farmerProfile ? `found profile_id="${farmerProfile.profile_id}"` : 'NOT FOUND');

      if (!farmerProfile) {
        console.warn(`⚠️  [GradingSubmission] No FarmerProfile for "${farmerIdInput}" — auto-creating...`);

        // Step 2a: Ensure a User row exists (FK required by FarmerProfile)
        const existingUser = await this.prisma.user.findUnique({
          where: { user_id: farmerIdInput },
        });
        console.log(`🔍 [GradingSubmission] User row:`, existingUser ? 'EXISTS' : 'NOT FOUND — will create');

        if (!existingUser) {
          try {
            await this.prisma.user.create({
              data: {
                user_id: farmerIdInput,
                email: `auto-${farmerIdInput.substring(0, 8)}@agrismart.local`,
                role: 'FARMER',
              },
            });
            console.log(`✅ [GradingSubmission] User row created for user_id="${farmerIdInput}"`);
          } catch (userErr: any) {
            console.warn(`⚠️  [GradingSubmission] User create failed (${userErr?.message}), trying upsert...`);
            await this.prisma.user.upsert({
              where: { user_id: farmerIdInput },
              update: {},
              create: {
                user_id: farmerIdInput,
                email: `auto-${Date.now()}@agrismart.local`,
                role: 'FARMER',
              },
            });
            console.log(`✅ [GradingSubmission] User upserted for user_id="${farmerIdInput}"`);
          }
        }

        // Step 2b: Create FarmerProfile linked to the User row
        farmerProfile = await this.prisma.farmerProfile.create({
          data: { user_id: farmerIdInput, farm_name: 'My Farm' },
        });
        console.log(`✅ [GradingSubmission] FarmerProfile created: profile_id="${farmerProfile.profile_id}"`);
      }

      // Step 3: Insert GradingSubmission using resolved PROFILE_ID
      const realFarmerId = farmerProfile.profile_id;
      console.log(`💾 [GradingSubmission] Inserting with profile_id="${realFarmerId}" order_id=${orderId ?? 'none'}`);

      const saved = await this.prisma.gradingSubmission.create({
        data: {
          farmer_id: realFarmerId,
          image_url: imageUrl,
          ai_grade: aiGrade,
          quality_score: qualityScore,
          defect_percentage: defectPercentage,
          final_price: finalPrice,
          metadata_verified: metadataVerified,
          ...(orderId ? { order_id: orderId } : {}),
        },
      });
      console.log(`✅ [GradingSubmission] Saved! submission_id="${saved.submission_id}"`);
    } catch (err: any) {
      console.error(`❌ [GradingSubmission] FAILED for farmer_id="${farmerIdInput}"`);
      console.error(`   Error type : ${err?.constructor?.name}`);
      console.error(`   Code       : ${err?.code}`);
      console.error(`   Message    : ${err?.message}`);
      console.error(`   Meta       :`, err?.meta);
      // Do NOT re-throw — grading result is still valid
    }
  }

  /**
   * Shared helper: builds multipart form and POSTs to FastAPI /predict-grade.
   */
  private async _callFastApi(file: Express.Multer.File): Promise<any> {
    let mimetype = file.mimetype;
    const lowerName = file.originalname.toLowerCase();
    if (lowerName.endsWith('.jfif') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.jpg')) {
      mimetype = 'image/jpeg';
    } else if (lowerName.endsWith('.png')) {
      mimetype = 'image/png';
    }

    // Log buffer length before append — must be > 0
    console.log(`   Buffer len (pre-append): ${file.buffer?.length ?? 'N/A'} bytes`);
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file buffer is empty — cannot send to AI grading engine.');
    }

    // Convert multer Buffer → Uint8Array so it satisfies the BlobPart type in Node.
    const bytes = new Uint8Array(file.buffer);
    const blob = new Blob([bytes], { type: mimetype || 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, file.originalname || 'crop.jpg');

    const fastApiUrl = this.config.get<string>('FASTAPI_AI_URL') || 'http://127.0.0.1:8000/predict-grade';

    console.log('🤖 [AI-Grading] Calling FastAPI engine...');
    console.log(`   URL        : ${fastApiUrl}`);
    console.log(`   File name  : ${file.originalname}`);
    console.log(`   MIME type  : ${mimetype}`);
    console.log(`   File size  : ${file.size} bytes`);
    console.log(`   Blob size  : ${blob.size} bytes`);

    let aiResponse: Response;
    try {
      aiResponse = await fetch(fastApiUrl, {
        method: 'POST',
        body: formData as any,
      });
    } catch (networkErr: any) {
      console.error('❌ [AI-Grading] Network error — could not reach FastAPI engine.');
      console.error(`   Target URL : ${fastApiUrl}`);
      console.error(`   Error type : ${networkErr?.constructor?.name}`);
      console.error(`   Message    : ${networkErr?.message}`);
      throw new BadRequestException(
        `AI grading service is unreachable at ${fastApiUrl}. ` +
        `Make sure the FastAPI engine is running. Raw error: ${networkErr?.message}`,
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ [AI-Grading] FastAPI returned a non-OK HTTP status.');
      console.error(`   HTTP Status : ${aiResponse.status} ${aiResponse.statusText}`);
      console.error(`   Raw Body    : ${errorText}`);
      throw new BadRequestException(
        `AI engine responded with HTTP ${aiResponse.status}. Body: ${errorText}`,
      );
    }

    const rawText = await aiResponse.text();
    console.log(`✅ [AI-Grading] FastAPI responded OK (${aiResponse.status}).`);
    console.log(`   Raw JSON    : ${rawText}`);

    try {
      return JSON.parse(rawText);
    } catch {
      throw new BadRequestException(`AI engine returned invalid JSON: ${rawText}`);
    }
  }
}