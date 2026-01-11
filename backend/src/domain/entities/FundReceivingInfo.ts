import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('fund_receiving_infos')
export class FundReceivingInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fund_id' })
  fundId: number;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'varchar', name: 'account_number', nullable: true })
  accountNumber: string;

  @Column({ type: 'varchar', name: 'account_name', nullable: true })
  accountName: string;

  @Column({ type: 'varchar', name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ type: 'varchar', name: 'qr_code_url', nullable: true })
  qrCodeUrl: string;

  @Column({ type: 'boolean', name: 'is_active', nullable: true })
  isActive: boolean;
}
