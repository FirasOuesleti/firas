import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cause } from '../causes/cause.entity';

@Entity({ name: 'stops' })
export class Stop {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** DATE — production day */
  @Column({ name: 'Jour', type: 'date' })
  jour!: string; // YYYY-MM-DD

  /** TIME — stop start time */
  @Column({ name: 'Debut', type: 'time' })
  debut!: string; // HH:mm:ss

  /** TIME — stop end time (nullable while stop is open) */
  @Column({ name: 'Fin', type: 'time', nullable: true })
  fin!: string | null; // HH:mm:ss

  /** GENERATED STORED — duration in seconds */
  @Column({ name: 'Duree', type: 'int', unsigned: true, insert: false, update: false, nullable: true })
  duree!: number | null;

  @Column({ name: 'cause_id', type: 'int', unsigned: true })
  causeId!: number;

  /** GENERATED STORED — 1 | 2 | 3 */
  @Column({ name: 'equipe', type: 'tinyint', unsigned: true, insert: false, update: false })
  equipe!: number;

  @ManyToOne(() => Cause, { eager: true })
  @JoinColumn({ name: 'cause_id', referencedColumnName: 'id' })
  cause!: Cause;
}
