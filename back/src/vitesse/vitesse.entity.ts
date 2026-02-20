import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const decimalToNumber = {
    to: (v: number) => v,
    from: (v: string | number) => Number(v),
};

@Entity({ name: 'vitesse_entries' })
export class VitesseEntry {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id: number;

    @Column({ name: 'recorded_at', type: 'datetime' })
    recordedAt!: Date;

    @Column({
        name: 'speed',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: decimalToNumber,
    })
    speed!: number;

    @Column({ name: 'note', type: 'varchar', length: 40, nullable: true })
    note!: string | null;
}
