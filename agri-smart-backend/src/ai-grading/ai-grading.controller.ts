import { Controller, Post, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiGradingService } from './ai-grading.service';
import { SubmitGradingDto } from './dto/submit-grading.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@Controller('ai-grading')
export class AiGradingController {
    constructor(private readonly aiService: AiGradingService) { }

    @Post(':orderId')
    @UseInterceptors(FileInterceptor('file'))
    // @UseGuards(SupabaseAuthGuard)
    async submitGrading(
        @Param('orderId') orderId: string,
        @Body() dto: SubmitGradingDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.aiService.processGrading(orderId, dto, file);
    }
}
