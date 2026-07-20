import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId must be an integer.' })
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer.' })
  @Min(5, { message: 'limit must be at least 5.' })
  @Max(50, { message: 'limit must be at most 50.' })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
}
