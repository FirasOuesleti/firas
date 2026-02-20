import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListStopsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  from?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  to?: string; // YYYY-MM-DD

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  causeId?: number;

  @IsIn(['Equipe 1', 'Equipe 2', 'Equipe 3'])
  equipe: 'Equipe 1' | 'Equipe 2' | 'Equipe 3' = 'Equipe 1';
}
