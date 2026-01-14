import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('funds')
export class Fund {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'manager_member_id' })
  managerMemberId: number;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    name: 'target_amount',
    nullable: true,
    precision: 15,
    scale: 2,
  })
  targetAmount: number;

  @Column({
    type: 'decimal',
    name: 'current_amount',
    nullable: true,
    precision: 15,
    scale: 2,
  })
  currentAmount: number;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
