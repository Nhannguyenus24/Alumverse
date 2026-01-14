import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('session_feedbacks')
export class SessionFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id' })
  sessionId: number;

  @Column({ name: 'mentee_member_id' })
  menteeMemberId: number;

  @Column({ type: 'integer', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'boolean', name: 'is_public', nullable: true })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
