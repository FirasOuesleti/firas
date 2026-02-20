import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateVitesseDto } from './dto/create-vitesse.dto';
import { ListVitesseQueryDto } from './dto/list-vitesse.query.dto';
import { VitesseRangeQueryDto } from './dto/vitesse-range.query.dto';
import { VitesseEntry } from './vitesse.entity';

@Injectable()
export class VitesseService {
    constructor(
        @InjectRepository(VitesseEntry)
        private readonly repo: Repository<VitesseEntry>,
    ) { }

    private applyRange(qb: SelectQueryBuilder<VitesseEntry>, query: VitesseRangeQueryDto) {
        if (query.from && query.to && query.from > query.to) {
            throw new BadRequestException('from must be <= to');
        }
        if (query.from) qb.andWhere('DATE(v.recorded_at) >= :from', { from: query.from });
        if (query.to) qb.andWhere('DATE(v.recorded_at) <= :to', { to: query.to });
    }

    async create(dto: CreateVitesseDto) {
        const entry = this.repo.create({
            recordedAt: dto.recordedAt ?? new Date(),
            speed: dto.speed,
            note: dto.note?.trim() || null,
        });

        const saved = await this.repo.save(entry);
        return this.toDto(saved);
    }

    async list(query: ListVitesseQueryDto) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 50, 200);

        const qb: SelectQueryBuilder<VitesseEntry> = this.repo
            .createQueryBuilder('v')
            .orderBy('v.id', 'DESC')
            .take(limit)
            .skip((page - 1) * limit);

        this.applyRange(qb, query);

        const [items, total] = await qb.getManyAndCount();

        return {
            items: items.map((e) => this.toDto(e)),
            total,
            page,
            limit,
        };
    }

    async getDailySeries(query: VitesseRangeQueryDto) {
        const qb: SelectQueryBuilder<VitesseEntry> = this.repo
            .createQueryBuilder('v')
            .select('DATE(v.recorded_at)', 'day')
            .addSelect('ROUND(AVG(v.speed), 3)', 'avgSpeed')
            .addSelect('ROUND(MAX(v.speed), 3)', 'maxSpeed')
            .addSelect('COUNT(*)', 'samples')
            .groupBy('DATE(v.recorded_at)')
            .orderBy('day', 'ASC');

        this.applyRange(qb, query);

        const rows = await qb.getRawMany<{ day: string; avgSpeed: string | number; maxSpeed: string | number; samples: string | number }>();

        return rows.map((r) => ({
            day: r.day,
            avgSpeed: Number(r.avgSpeed ?? 0),
            maxSpeed: Number(r.maxSpeed ?? 0),
            samples: Number(r.samples ?? 0),
        }));
    }

    async getSummary(query: VitesseRangeQueryDto) {
        const qb: SelectQueryBuilder<VitesseEntry> = this.repo
            .createQueryBuilder('v')
            .select('ROUND(COALESCE(AVG(v.speed), 0), 3)', 'avgSpeed')
            .addSelect('ROUND(COALESCE(MAX(v.speed), 0), 3)', 'maxSpeed')
            .addSelect('COUNT(*)', 'samples');

        this.applyRange(qb, query);

        const row = await qb.getRawOne<{ avgSpeed: string | number; maxSpeed: string | number; samples: string | number }>();

        return {
            from: query.from ?? null,
            to: query.to ?? null,
            avgSpeed: Number(row?.avgSpeed ?? 0),
            maxSpeed: Number(row?.maxSpeed ?? 0),
            samples: Number(row?.samples ?? 0),
        };
    }

    private toDto(e: VitesseEntry) {
        return {
            id: Number(e.id),
            recordedAt: e.recordedAt instanceof Date ? e.recordedAt.toISOString() : e.recordedAt,
            speed: Number(e.speed),
            note: e.note,
        };
    }
}
