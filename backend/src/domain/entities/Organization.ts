import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug: string;

  @Column({ type: 'varchar', name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ type: 'json', name: 'brand_config', nullable: true })
  brandConfig: any;

  @Column({ type: 'json', name: 'features_config', nullable: true })
  featuresConfig: any;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
