import { IsString, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string; // e.g., "Tomato"

  @IsString()
  category: string; // e.g., "Vegetable"

  @IsOptional() // This means the description is not mandatory
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
