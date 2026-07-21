import { IsString, IsNumber } from 'class-validator';

export class SubmitGradingDto {
  @IsString()
  image_url: string; // In a real app, this would be the uploaded image path

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
  
  @IsString()
price_id: string; // 👈 Add this line

}
