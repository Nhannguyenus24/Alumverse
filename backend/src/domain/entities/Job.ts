import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'poster_member_id' })
  posterMemberId: number;

  @Column({ type: 'boolean', name: 'is_referral', default: false })
  isReferral: boolean;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'varchar', name: 'company_name', nullable: true })
  companyName: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({ type: 'varchar', name: 'salary_range', nullable: true })
  salaryRange: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'how_to_apply', nullable: true })
  howToApply: string;

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ type: 'boolean', name: 'is_active', nullable: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
