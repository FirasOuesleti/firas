import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** name is no longer the PK (id is), so it can be updated if needed */
export class UpdateCauseDto {
    @IsOptional()
    @IsString()
    @MaxLength(80)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsBoolean()
    affectTrs?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
