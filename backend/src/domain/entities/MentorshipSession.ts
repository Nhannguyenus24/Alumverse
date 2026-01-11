import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('mentorship_sessions')
export class MentorshipSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'availability_id' })
  availabilityId: number;

  @Column({ name: 'mentee_member_id' })
  menteeMemberId: number;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'text', name: 'booking_note', nullable: true })
  bookingNote: string;

  @Column({ type: 'varchar', name: 'meeting_link', nullable: true })
  meetingLink: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
