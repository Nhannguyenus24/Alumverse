import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('news')
export class New {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'author_member_id' })
  authorMemberId: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'boolean', name: 'is_hidden', nullable: true })
  isHidden: boolean;

  @Column({ type: 'timestamp', name: 'published_at', nullable: true })
  publishedAt: Date;
}
