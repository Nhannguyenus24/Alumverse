import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('organization_members')
@Index(['organizationId', 'userId'], { unique: true })
export class OrganizationMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', name: 'display_name', nullable: true })
  displayName: string;

  @Column({ type: 'varchar', name: 'org_specific_avatar_url', nullable: true })
  orgSpecificAvatarUrl: string;

  @Column({ type: 'integer', name: 'verification_level', default: 0 })
  verificationLevel: number;

  @Column({ type: 'boolean', name: 'is_trusted_verifier', default: false })
  isTrustedVerifier: boolean;

  @Column({ type: 'varchar', default: 'Active' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'joined_at' })
  joinedAt: Date;
}
