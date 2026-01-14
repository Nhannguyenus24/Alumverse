import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('event_tickets')
export class EventTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'member_id', nullable: true })
  memberId: number;

  @Column({ type: 'varchar', name: 'guest_name', nullable: true })
  guestName: string;

  @Column({ type: 'varchar', name: 'guest_email', nullable: true })
  guestEmail: string;

  @Column({ type: 'varchar', name: 'guest_phone', nullable: true })
  guestPhone: string;

  @Column({
    type: 'varchar',
    name: 'ticket_code',
    unique: true,
    nullable: true,
  })
  ticketCode: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'registered_at' })
  registeredAt: Date;

  @Column({ type: 'timestamp', name: 'checked_in_at', nullable: true })
  checkedInAt: Date;
}
