import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('global_profiles')
export class GlobalProfile {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', name: 'full_name', nullable: true })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'varchar', nullable: true })
  gender: string;

  @Column({ type: 'json', nullable: true })
  settings: any;
}
