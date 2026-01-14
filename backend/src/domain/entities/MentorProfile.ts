import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('mentor_profiles')
export class MentorProfile {
  @PrimaryColumn({ name: 'member_id' })
  memberId: number;

  @Column({ type: 'varchar', name: 'current_job_title', nullable: true })
  currentJobTitle: string;

  @Column({ type: 'varchar', name: 'current_company', nullable: true })
  currentCompany: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'decimal',
    name: 'rating_avg',
    default: 0,
    precision: 10,
    scale: 2,
  })
  ratingAvg: number;

  @Column({ type: 'integer', name: 'total_sessions', default: 0 })
  totalSessions: number;

  @Column({ type: 'boolean', name: 'is_approved', default: false })
  isApproved: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
