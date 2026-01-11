import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('fund_expenses')
export class FundExpense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fund_id' })
  fundId: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'decimal', nullable: true, precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date', name: 'expense_date', nullable: true })
  expenseDate: Date;

  @Column({ type: 'varchar', name: 'proof_document_url', nullable: true })
  proofDocumentUrl: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
