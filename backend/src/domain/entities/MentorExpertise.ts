import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('mentor_expertise')
export class MentorExpertise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mentor_member_id' })
  mentorMemberId: number;

  @Column({ type: 'varchar', nullable: true })
  topic: string;

  @Column({ type: 'integer', name: 'years_experience', nullable: true })
  yearsExperience: number;

  @Column({ type: 'text', nullable: true })
  description: string;
}
