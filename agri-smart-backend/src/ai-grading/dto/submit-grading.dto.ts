import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitGradingDto {
  @IsOptional()
  @IsString()
  image_url?: string; // optional image URL

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;
  
  @IsOptional()
  @IsString()
  price_id?: string; // optional market price ID override

  @IsOptional()
  @IsString()
  product_id?: string; // product ID for market price lookup

  @IsOptional()
  @IsString()
  farmer_id?: string;
}
