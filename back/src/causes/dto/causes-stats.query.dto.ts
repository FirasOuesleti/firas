import { IsIn, IsOptional, IsString } from 'class-validator';

export class CausesStatsQueryDto {
    @IsOptional()
    @IsString()
    from?: string; // YYYY-MM-DD

    @IsOptional()
    @IsString()
    to?: string; // YYYY-MM-DD

    @IsOptional()
    @IsIn(['Equipe 1', 'Equipe 2', 'Equipe 3'])
    equipe?: 'Equipe 1' | 'Equipe 2' | 'Equipe 3';
}
