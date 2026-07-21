import { IsString, IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  product_id: string; // The ID of the vegetable (Tomato, etc.)

  @IsInt()
  @Min(1)
  quantity: number; // How many kilograms? (Minimum 1kg)
}
