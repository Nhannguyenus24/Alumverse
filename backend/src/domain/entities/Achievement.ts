import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'date', name: 'awarded_date', nullable: true })
  awardedDate: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
