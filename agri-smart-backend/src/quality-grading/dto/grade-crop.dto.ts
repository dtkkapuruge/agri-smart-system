export class QualityGradingResponseDto {
  prediction: string;
  confidenceScore: string;
  qualityGrade: string;
  suggestedPriceCategory: string;
  isAccepted: boolean;
}
