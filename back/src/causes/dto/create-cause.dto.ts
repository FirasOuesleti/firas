import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateCauseDto {
  @IsString()
  @Length(1, 80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  description?: string;

  @IsOptional()
  @IsBoolean()
  affectTrs?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
