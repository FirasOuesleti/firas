import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

/** Map equipe filter string → DB tinyint */
function equipeNumber(label: string): number {
    if (label === 'Equipe 1') return 1;
    if (label === 'Equipe 2') return 2;
    return 3;
}
import { Cause } from './cause.entity';
import { CreateCauseDto } from './dto/create-cause.dto';
import { ListCausesQueryDto } from './dto/list-causes.query.dto';
import { UpdateCauseDto } from './dto/update-cause.dto';

@Injectable()
export class CausesService {
    constructor(
        @InjectRepository(Cause)
        private readonly repo: Repository<Cause>,
    ) { }

    async create(dto: CreateCauseDto): Promise<Cause> {
        const cause = this.repo.create({
            name: dto.name.trim(),
            description: dto.description?.trim() ?? null,
            affectTrs: dto.affectTrs ?? true,
            isActive: dto.isActive ?? true,
        });

        return this.repo.save(cause);
    }

    async findAll(query: ListCausesQueryDto) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 100, 1000);

        const qb: SelectQueryBuilder<Cause> = this.repo.createQueryBuilder('c');

        if (query.isActive !== undefined) {
            qb.andWhere('c.isActive = :isActive', { isActive: query.isActive });
        }

        if (query.affectTrs !== undefined) {
            qb.andWhere('c.affectTrs = :affectTrs', { affectTrs: query.affectTrs });
        }

        if (query.search?.trim()) {
            const s = `%${query.search.trim()}%`;
            qb.andWhere('(c.name LIKE :s OR c.description LIKE :s)', { s });
        }

        qb.orderBy('c.name', 'ASC')
            .take(limit)
            .skip((page - 1) * limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            items: items.map((c) => this.toDto(c)),
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<Cause> {
        const cause = await this.repo.findOne({ where: { id } });
        if (!cause) throw new NotFoundException(`Cause id=${id} not found`);
        return cause;
    }

    async findOneDto(id: number) {
        return this.toDto(await this.findOne(id));
    }

    async update(id: number, dto: UpdateCauseDto): Promise<Cause> {
        const cause = await this.findOne(id);

        if (dto.name !== undefined) cause.name = dto.name.trim();
        if (dto.description !== undefined) {
            const d = dto.description?.trim();
            cause.description = d ? d : null;
        }

        if (dto.affectTrs !== undefined) cause.affectTrs = dto.affectTrs;
        if (dto.isActive !== undefined) cause.isActive = dto.isActive;

        return this.repo.save(cause);
    }

    // ─── In-memory cache for getStats (60s TTL) ───
    private statsCache = new Map<string, { data: unknown[]; ts: number }>();
    private readonly STATS_TTL_MS = 60_000;

    /** Global per-cause statistics (LEFT JOIN → causes with 0 stops included) */
    async getStats(query: { from?: string; to?: string; equipe?: string } = {}) {
        const from = query.from?.trim() || '';
        const to = query.to?.trim() || '';
        const eqVal = query.equipe || 'Equipe 1';
        const cacheKey = `${from}|${to}|${eqVal}`;

        const now = Date.now();
        const cached = this.statsCache.get(cacheKey);
        if (cached && now - cached.ts < this.STATS_TTL_MS) {
            return cached.data;
        }

        // Build LEFT JOIN ON condition — filters go HERE to preserve all causes
        const joinParts: string[] = ['s.cause_id = c.id'];
        const params: Record<string, string> = {};

        if (from) {
            joinParts.push('s.Jour >= :from');
            params.from = from;
        }
        if (to) {
            joinParts.push('s.Jour <= :to');
            params.to = to;
        }

        joinParts.push('s.equipe = :equipe');
        params.equipe = String(equipeNumber(eqVal));

        const rows: { id: number; name: string; affectTrs: number; totalDuration: string; stopCount: string }[] =
            await this.repo
                .createQueryBuilder('c')
                .leftJoin('stops', 's', joinParts.join(' AND '), params)
                .select('c.id', 'id')
                .addSelect('c.name', 'name')
                .addSelect('c.affect_trs', 'affectTrs')
                .addSelect('COALESCE(SUM(s.Duree), 0)', 'totalDuration')
                .addSelect('COUNT(s.id)', 'stopCount')
                .groupBy('c.id')
                .addGroupBy('c.name')
                .addGroupBy('c.affect_trs')
                .orderBy('totalDuration', 'DESC')
                .getRawMany();

        const result = rows.map((r) => ({
            id: Number(r.id),
            name: r.name,
            affectTrs: r.affectTrs === 1 || r.affectTrs === (true as unknown),
            totalDurationSeconds: Number(r.totalDuration) || 0,
            stopCount: Number(r.stopCount) || 0,
        }));

        this.statsCache.set(cacheKey, { data: result, ts: now });
        return result;
    }

    /** Map entity to API response DTO */
    private toDto(c: Cause) {
        return {
            id: Number(c.id),
            name: c.name,
            description: c.description,
            affectTrs: c.affectTrs,
            isActive: c.isActive,
        };
    }
}
