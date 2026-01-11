import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('global_identity_verifications')
export class GlobalIdentityVerification {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', name: 'citizen_id', unique: true, nullable: true })
  citizenId: string;

  @Column({ type: 'json', name: 'extracted_data', nullable: true })
  extractedData: any;

  @Column({ type: 'timestamp', name: 'verified_at', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  provider: string;
}
