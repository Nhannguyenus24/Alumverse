import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('forum_topics')
export class ForumTopic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ name: 'created_by_member_id' })
  createdByMemberId: number;
}
