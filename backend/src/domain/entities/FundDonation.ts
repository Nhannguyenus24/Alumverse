import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('fund_donations')
export class FundDonation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fund_id' })
  fundId: number;

  @Column({ name: 'donor_member_id', nullable: true })
  donorMemberId: number;

  @Column({ type: 'varchar', name: 'donor_name', nullable: true })
  donorName: string;

  @Column({ type: 'decimal', nullable: true, precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'varchar', name: 'proof_image_url', nullable: true })
  proofImageUrl: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
