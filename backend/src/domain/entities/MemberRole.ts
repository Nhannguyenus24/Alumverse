import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('member_roles')
export class MemberRole {
  @PrimaryColumn({ name: 'member_id' })
  memberId: number;

  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  @CreateDateColumn({ type: 'timestamp', name: 'assigned_at' })
  assignedAt: Date;
}
