import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('verification_requests')
export class VerificationRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ type: 'varchar', name: 'document_url', nullable: true })
  documentUrl: string;

  @Column({ type: 'varchar', name: 'document_type', nullable: true })
  documentType: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'text', name: 'admin_note', nullable: true })
  adminNote: string;

  @Column({ name: 'reviewed_by_member_id', nullable: true })
  reviewedByMemberId: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
