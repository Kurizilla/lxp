import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedResponseDto<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];

  constructor(data: T[], total: number, page: number, limit: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.data = data;
  }

  static create<T>(data: T[], total: number, page: number, limit: number): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(data, total, page, limit);
  }
}
