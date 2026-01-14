import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('saved_items')
@Index(['memberId', 'itemType', 'itemId'], { unique: true })
export class SavedItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ type: 'varchar', name: 'item_type', nullable: true })
  itemType: string;

  @Column({ type: 'integer', name: 'item_id', nullable: true })
  itemId: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ type: 'timestamp', name: 'saved_at' })
  savedAt: Date;
}
