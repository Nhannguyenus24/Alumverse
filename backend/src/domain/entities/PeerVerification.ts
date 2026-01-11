import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('peer_verifications')
@Index(['targetMemberId', 'verifierMemberId'], { unique: true })
export class PeerVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'target_member_id' })
  targetMemberId: number;

  @Column({ name: 'verifier_member_id' })
  verifierMemberId: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
