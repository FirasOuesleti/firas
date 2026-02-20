import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MetrageEntry } from './metrage.entity';
import { CreateMetrageDto } from './dto/create-metrage.dto';
import { MetrageRangeQueryDto } from './dto/metrage-range.query.dto';

@Injectable()
export class MetrageService {
    constructor(
        @InjectRepository(MetrageEntry)
        private readonly repo: Repository<MetrageEntry>,
    ) { }

    async create(dto: CreateMetrageDto) {
        const entry = this.repo.create({
            recordedAt: dto.recordedAt ?? new Date(),
            meters: dto.meters,
            note: dto.note?.trim() || null,
        });

        const saved = await this.repo.save(entry);
        return this.toDto(saved);
    }

    private applyRange(qb: SelectQueryBuilder<MetrageEntry>, query: MetrageRangeQueryDto) {
        if (query.from && query.to && query.from > query.to) {
            throw new BadRequestException('from must be <= to');
        }
        if (query.from) qb.andWhere('DATE(m.recorded_at) >= :from', { from: query.from });
        if (query.to) qb.andWhere('DATE(m.recorded_at) <= :to', { to: query.to });
    }

    async getDailySeries(query: MetrageRangeQueryDto) {
        const qb: SelectQueryBuilder<MetrageEntry> = this.repo
            .createQueryBuilder('m')
            .select('DATE(m.recorded_at)', 'day')
            .addSelect('ROUND(SUM(m.meters), 3)', 'totalMeters')
            .addSelect('COUNT(*)', 'samples')
            .groupBy('DATE(m.recorded_at)')
            .orderBy('day', 'ASC');

        this.applyRange(qb, query);

        const rows = await qb.getRawMany<{ day: string; totalMeters: string | number; samples: string | number }>();

        return rows.map((r) => ({
            day: r.day,
            totalMeters: Number(r.totalMeters ?? 0),
            samples: Number(r.samples ?? 0),
        }));
    }

    async getTotal(query: MetrageRangeQueryDto) {
        const qb: SelectQueryBuilder<MetrageEntry> = this.repo
            .createQueryBuilder('m')
            .select('ROUND(COALESCE(SUM(m.meters), 0), 3)', 'totalMeters')
            .addSelect('COUNT(*)', 'samples');

        this.applyRange(qb, query);

        const row = await qb.getRawOne<{ totalMeters: string | number; samples: string | number }>();

        return {
            from: query.from ?? null,
            to: query.to ?? null,
            totalMeters: Number(row?.totalMeters ?? 0),
            samples: Number(row?.samples ?? 0),
        };
    }

    private toDto(e: MetrageEntry) {
        return {
            id: Number(e.id),
            recordedAt: e.recordedAt instanceof Date ? e.recordedAt.toISOString() : e.recordedAt,
            meters: Number(e.meters),
            note: e.note,
        };
    }
}
