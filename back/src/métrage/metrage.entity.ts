import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const decimalToNumber = {
    to: (v: number) => v,
    from: (v: string | number) => Number(v),
};

@Entity({ name: 'metrage_entries' })
export class MetrageEntry {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id: number;

    @Column({ name: 'recorded_at', type: 'datetime' })
    recordedAt!: Date;

    @Column({
        name: 'meters',
        type: 'decimal',
        precision: 12,
        scale: 3,
        transformer: decimalToNumber,
    })
    meters!: number;

    @Column({ name: 'note', type: 'varchar', length: 40, nullable: true })
    note!: string | null;
}
