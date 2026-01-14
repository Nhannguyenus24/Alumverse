import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('mentor_availabilities')
export class MentorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mentor_member_id' })
  mentorMemberId: number;

  @Column({ type: 'timestamp', name: 'start_time', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ type: 'varchar', default: 'Available' })
  status: string;
}
