import { IsNumber, Min } from 'class-validator';

export class SetPriceDto {
  @IsNumber()
  @Min(0) // Price cannot be negative
  harti_base_price: number; // e.g., 150.50
}
