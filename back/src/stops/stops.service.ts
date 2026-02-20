import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Cause } from '../causes/cause.entity';
import { Stop } from './stop.entity';
import { CreateStopDto } from './dto/create-stop.dto';
import { ListStopsQueryDto } from './dto/list-stops.query.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { DailyAnalyticsQueryDto } from './dto/daily-analytics.query.dto';

const SHIFT_SECONDS = 8 * 3600;

/** Map equipe number (1|2|3) → display label */
function equipeLabel(n: number): string {
    if (n === 1) return 'Equipe 1';
    if (n === 2) return 'Equipe 2';
    return 'Equipe 3';
}

/** Map equipe filter string → DB tinyint */
function equipeNumber(label: string): number {
    if (label === 'Equipe 1') return 1;
    if (label === 'Equipe 2') return 2;
    return 3;
}

/** Timezone-safe Date → YYYY-MM-DD using local getters (never toISOString). */
function formatDateOnly(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y} -${m} -${day} `;
}

@Injectable()
export class StopsService {
    private readonly logger = new Logger(StopsService.name);
    private readonly microStopMaxSeconds: number;

    constructor(
        @InjectRepository(Stop) private readonly stopRepo: Repository<Stop>,
        @InjectRepository(Cause) private readonly causeRepo: Repository<Cause>,
        private readonly config: ConfigService,
    ) {
        this.microStopMaxSeconds = this.config.get<number>(
            'MICRO_STOP_MAX_SECONDS',
            300,
        );
    }

    // ─────────────────────── CRUD ───────────────────────

    async create(dto: CreateStopDto) {
        const stop = this.stopRepo.create({
            jour: dto.jour,
            debut: dto.debut,
            fin: dto.fin ?? null,
            causeId: dto.causeId,
        });
        // equipe and Duree are GENERATED columns — DB computes them

        try {
            const saved = await this.stopRepo.save(stop);
            return this.findOneDto(Number(saved.id));
        } catch (err: any) {
            if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.errno === 1452) {
                throw new BadRequestException(
                    `Unknown causeId "${dto.causeId}".Insert it first in causes table.`,
                );
            }
            throw err;
        }
    }

    async findAll(query: ListStopsQueryDto) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 50, 200);

        if (query.from && query.to && query.from > query.to) {
            throw new BadRequestException('"from" must be <= "to"');
        }

        const qb: SelectQueryBuilder<Stop> = this.stopRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.cause', 'c')
            .orderBy('s.id', 'DESC')
            .take(limit)
            .skip((page - 1) * limit);

        if (query.causeId)
            qb.andWhere('s.causeId = :causeId', { causeId: query.causeId });
        if (query.equipe)
            qb.andWhere('s.equipe = :equipe', { equipe: equipeNumber(query.equipe) });
        if (query.from)
            qb.andWhere('s.jour >= :fromDate', { fromDate: query.from });
        if (query.to)
            qb.andWhere('s.jour <= :toDate', { toDate: query.to });

        const [stops, total] = await qb.getManyAndCount();

        return {
            items: stops.map((s) => this.toStopDto(s)),
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<Stop> {
        const stop = await this.stopRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.cause', 'c')
            .where('s.id = :id', { id })
            .getOne();

        if (!stop) throw new NotFoundException(`Stop(id = ${id}) not found`);
        return stop;
    }

    async findOneDto(id: number) {
        return this.toStopDto(await this.findOne(id));
    }

    async update(id: number, dto: UpdateStopDto) {
        const stop = await this.findOne(id);

        if (dto.jour !== undefined) stop.jour = dto.jour;
        if (dto.debut !== undefined) stop.debut = dto.debut;
        if (dto.fin !== undefined) stop.fin = dto.fin ?? null;
        if (dto.causeId !== undefined) stop.causeId = dto.causeId;

        try {
            await this.stopRepo.save(stop);
            return this.findOneDto(id);
        } catch (err: any) {
            if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.errno === 1452) {
                throw new BadRequestException(
                    `Unknown causeId "${stop.causeId}".`,
                );
            }
            throw err;
        }
    }

    /**
     * Daily summary with mathematical TRS precision.
     * Logic aligns 100% with Python pseudo-code provided.
     */
    async getDailyStopsSummary(
        query: Partial<DailyAnalyticsQueryDto> = {},
    ) {
        const from = query.from?.trim();
        const to = query.to?.trim();
        const equipeLabel = query.equipe ?? 'Equipe 1';

        if (from && to && from > to) {
            throw new BadRequestException('"from" must be <= "to"');
        }

        // --- 1. SQL Query for Downtime ---
        const durExpr = `
CASE
        WHEN s.Fin IS NOT NULL THEN s.Duree
        ELSE LEAST(
    TIMESTAMPDIFF(SECOND, TIMESTAMP(s.Jour, s.Debut), NOW()),
    ${SHIFT_SECONDS}
)
END
    `;

        const qb = this.stopRepo
            .createQueryBuilder('s')
            .leftJoin('s.cause', 'c')
            .select('s.Jour', 'day') // DB column is "Jour"
            .addSelect('COUNT(*)', 'stopsCount')
            .addSelect(`SUM(${durExpr})`, 'totalDowntimeSeconds')
            .addSelect(
                `SUM(CASE WHEN c.affect_trs = 1 THEN ${durExpr} ELSE 0 END)`,
                'trsDowntimeSeconds',
            )
            .groupBy('s.Jour')
            .orderBy('day', 'DESC');

        if (this.microStopMaxSeconds > 0) {
            qb.andWhere('(s.Fin IS NULL OR s.Duree > :microMax)', {
                microMax: this.microStopMaxSeconds,
            });
        }

        qb.andWhere('s.equipe = :equipe', { equipe: equipeNumber(equipeLabel) });
        if (from) qb.andWhere('s.Jour >= :fromDate', { fromDate: from });
        if (to) qb.andWhere('s.Jour <= :toDate', { toDate: to });

        const rows = await qb.getRawMany<any>();

        // --- 2. Post-Process & Math Calculation (Perfect Logic) ---
        // - [x] Refactor TRS calculation in backend `StopsService`
        // - [x] Fix `equipe` type comparison (numeric vs label)
        // - [x] Fix time units (milliseconds vs seconds)
        // - [x] Fix date string lexical comparison
        // - [x] Ensure `affect_trs` filtering in SQL
        // - [x] Integrate backend TRS into frontend `StopsClient.tsx`
        // - [x] Fix frontend crash (safety check for `.toFixed`)
        return rows.map((r) => {
            const dayValue = r.day || r.Jour;

            // EMERGENCY FIX: Strict YYYY-MM-DD normalization using en-CA
            const dayObj = dayValue instanceof Date ? dayValue : new Date(dayValue);
            const dayStr = dayObj.toLocaleDateString('en-CA');

            // EMERGENCY FIX: Strict Number casting
            const rawDowntime = Number(r.totalDowntimeSeconds) || 0;
            const trsDowntimeSeconds = Number(r.trsDowntimeSeconds) || 0;

            const availableTime = this.calculateAvailableSeconds(dayStr, equipeLabel);

            const cappedDowntime = Math.max(0, Math.min(rawDowntime, availableTime));
            const cappedTrsDowntime = Math.max(0, Math.min(trsDowntimeSeconds, availableTime));

            const trsValue = this.calculateTRS(availableTime, cappedTrsDowntime);
            const workSeconds = Math.max(0, availableTime - cappedDowntime);

            return {
                day: dayStr,
                totalDowntimeSeconds: cappedDowntime,
                trsDowntimeSeconds: cappedTrsDowntime,
                totalWorkSeconds: workSeconds,
                trs: Number(trsValue.toFixed(2)),
                stopsCount: Number(r.stopsCount) || 0,
            };
        });
    }

    /**
     * PRECISION: Available time calculation logic.
     * Addresses Point 1 (Units), Point 2 (Numeric vs String Team), Point 3 (Lexical Strings).
     */
    private calculateAvailableSeconds(
        dayStr: string,
        equipeInput: string | number,
    ): number {
        const now = new Date();
        // EMERGENCY FIX: Strict en-CA normalization
        const todayStr = now.toLocaleDateString('en-CA');

        if (dayStr < todayStr) {
            return SHIFT_SECONDS;
        }
        if (dayStr > todayStr) {
            return 0;
        }

        // EMERGENCY FIX: Number casting and logic to handle both label and ID
        let eqNum = 0;
        const inputStr = String(equipeInput);
        if (inputStr.includes('1')) eqNum = 1;
        else if (inputStr.includes('2')) eqNum = 2;
        else if (inputStr.includes('3')) eqNum = 3;
        else eqNum = Number(equipeInput) || 1;

        let startHour = 0;
        if (eqNum === 1) startHour = 6;
        else if (eqNum === 2) startHour = 14;
        else if (eqNum === 3) startHour = 22;

        const startTime = new Date(dayStr + 'T00:00:00');
        startTime.setHours(startHour, 0, 0, 0);

        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        return Math.max(0, Math.min(elapsed, SHIFT_SECONDS));
    }

    /**
     * Point 1: yield calculation in identical units (SECONDS).
     */
    private calculateTRS(
        availableSeconds: number,
        trsDowntimeSeconds: number,
    ): number {
        if (availableSeconds <= 0) return 0;
        // Formula: ((Available - Downtime) / TotalShiftDuration) * 100
        const result =
            ((availableSeconds - trsDowntimeSeconds) / SHIFT_SECONDS) * 100;
        return Math.max(0, Math.min(result, 100));
    }

    // ─────────────────────── MAPPING ───────────────────────

    private toStopDto(s: Stop) {
        return {
            id: Number(s.id),
            jour: s.jour,
            debut: s.debut,
            fin: s.fin,
            duree: s.duree,
            equipe: equipeLabel(s.equipe),
            causeId: s.causeId,
            cause: s.cause
                ? {
                    id: s.cause.id,
                    name: s.cause.name,
                    description: s.cause.description,
                    affectTrs: s.cause.affectTrs,
                    isActive: s.cause.isActive,
                }
                : null,
        };
    }
}
