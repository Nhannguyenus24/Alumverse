import { Event } from '../entities/Event';
import { EventInterest } from '../entities/EventInterest';
import { EventTicket } from '../entities/EventTicket';

/**
 * Data Access Object interface for event management operations
 */
export interface IEventDAO {
  // Event CRUD
  createEvent(eventData: Partial<Event>): Promise<Event>;
  updateEvent(eventId: number, eventData: Partial<Event>): Promise<Event>;
  deleteEvent(eventId: number): Promise<boolean>;
  findEventById(eventId: number): Promise<Event | null>;
  findEventsByOrganization(
    organizationId: number,
    page: number,
    limit: number,
    filters?: { isPublished?: boolean },
  ): Promise<{ events: Event[]; total: number }>;

  // Event Publishing
  publishEvent(eventId: number): Promise<Event>;
  unpublishEvent(eventId: number): Promise<Event>;

  // Event Search & Filter
  findUpcomingEvents(
    organizationId: number,
    page: number,
    limit: number,
  ): Promise<{ events: Event[]; total: number }>;
  findPastEvents(
    organizationId: number,
    page: number,
    limit: number,
  ): Promise<{ events: Event[]; total: number }>;
  searchEvents(
    organizationId: number,
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ events: Event[]; total: number }>;

  // Event Interest
  addEventInterest(eventId: number, memberId: number): Promise<EventInterest>;
  removeEventInterest(eventId: number, memberId: number): Promise<boolean>;
  findEventInterests(
    eventId: number,
    page: number,
    limit: number,
  ): Promise<{ interests: EventInterest[]; total: number }>;
  checkUserInterest(eventId: number, memberId: number): Promise<boolean>;
  updateInterestedCount(eventId: number, increment: boolean): Promise<Event>;

  // Event Ticket Management
  registerTicket(ticketData: Partial<EventTicket>): Promise<EventTicket>;
  cancelTicket(ticketId: number): Promise<EventTicket>;
  checkInTicket(ticketId: number): Promise<EventTicket>;
  findTicketByCode(ticketCode: string): Promise<EventTicket | null>;
  findTicketsByEvent(
    eventId: number,
    page: number,
    limit: number,
  ): Promise<{ tickets: EventTicket[]; total: number }>;
  findTicketsByMember(
    memberId: number,
    page: number,
    limit: number,
  ): Promise<{ tickets: EventTicket[]; total: number }>;
  countRegisteredTickets(eventId: number): Promise<number>;

  // Event Statistics
  getEventStatistics(eventId: number): Promise<{
    interestedCount: number;
    registeredCount: number;
    checkedInCount: number;
    availableSlots: number;
  }>;
}
