import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class SyncProfileDto {
  @ApiProperty({ example: 'FARMER', enum: ['FARMER', 'BUYER'] })
  @IsEnum(['FARMER', 'BUYER'])
  role: 'FARMER' | 'BUYER';

  @ApiProperty({ example: '0712345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Golden Green Farm', required: false })
  @IsOptional()
  @IsString()
  farm_name?: string;

  @ApiProperty({ example: '123 Smart St, Colombo', required: false })
  @IsOptional()
  @IsString()
  delivery_address?: string; // 👈 Add this back!

  @ApiProperty({ example: 6.9271, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 79.8612, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
