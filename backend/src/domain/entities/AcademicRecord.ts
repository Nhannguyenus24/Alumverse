import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academic_records')
export class AcademicRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ type: 'varchar', name: 'student_code', nullable: true })
  studentCode: string;

  @Column({ type: 'varchar', name: 'degree_type', nullable: true })
  degreeType: string;

  @Column({ type: 'varchar', name: 'class_name', nullable: true })
  className: string;

  @Column({ type: 'integer', name: 'start_year', nullable: true })
  startYear: number;

  @Column({ type: 'integer', name: 'graduated_year', nullable: true })
  graduatedYear: number;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
