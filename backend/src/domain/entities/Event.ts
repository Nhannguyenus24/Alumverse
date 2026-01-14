import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'creator_member_id' })
  creatorMemberId: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', name: 'banner_url', nullable: true })
  bannerUrl: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({ type: 'timestamp', name: 'start_time', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ type: 'timestamp', name: 'registration_start_at', nullable: true })
  registrationStartAt: Date;

  @Column({ type: 'timestamp', name: 'registration_end_at', nullable: true })
  registrationEndAt: Date;

  @Column({ type: 'integer', name: 'max_capacity', nullable: true })
  maxCapacity: number;

  @Column({ type: 'integer', name: 'interested_count', default: 0 })
  interestedCount: number;

  @Column({ type: 'boolean', name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
