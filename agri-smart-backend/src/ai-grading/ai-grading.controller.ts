import { Controller, Post, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiGradingService } from './ai-grading.service';
import { SubmitGradingDto } from './dto/submit-grading.dto';
// import { SupabaseAuthGuard } from '../auth/auth.guard';

@Controller('ai-grading')
export class AiGradingController {
    constructor(private readonly aiService: AiGradingService) { }

    @Post('predict/:orderId')
    @UseInterceptors(FileInterceptor('file'))
    // @UseGuards(SupabaseAuthGuard)
    async predictGrading(
        @Param('orderId') orderId: string,
        @Body() dto: SubmitGradingDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Image file is required.');
        }

        if (dto.latitude !== undefined) {
            dto.latitude = Number(dto.latitude);
        }
        if (dto.longitude !== undefined) {
            dto.longitude = Number(dto.longitude);
        }
        
        return this.aiService.processGrading(orderId, dto, file);
    }
}
