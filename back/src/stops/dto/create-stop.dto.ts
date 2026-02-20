import { IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class CreateStopDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  jour!: string; // YYYY-MM-DD

  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  debut!: string; // HH:mm:ss

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  fin?: string; // HH:mm:ss

  @IsOptional()
  @IsInt()
  causeId?: number;
}
