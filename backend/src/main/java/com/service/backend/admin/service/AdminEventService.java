package com.service.backend.admin.service;

import com.service.backend.admin.dto.EventStatisticsDTO;
import com.service.backend.event.dao.EventInterestR2dbcRepository;
import com.service.backend.event.dao.EventR2dbcRepository;
import com.service.backend.event.dao.EventTicketR2dbcRepository;
import com.service.backend.event.dto.UpdateEventRequest;
import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventInterest;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class AdminEventService {

    private static final Logger log = LoggerFactory.getLogger(AdminEventService.class);

    private static final String STATUS_REGISTERED = "REGISTERED";
    private static final String STATUS_CHECKED_IN = "CHECKED_IN";
    private static final String STATUS_CANCELLED = "CANCELLED";

    private final EventR2dbcRepository eventRepo;
    private final EventTicketR2dbcRepository ticketRepo;
    private final EventInterestR2dbcRepository interestRepo;
    private final ImageService imageService;

    public AdminEventService(EventR2dbcRepository eventRepo,
                             EventTicketR2dbcRepository ticketRepo,
                             EventInterestR2dbcRepository interestRepo,
                             ImageService imageService) {
        this.eventRepo = eventRepo;
        this.ticketRepo = ticketRepo;
        this.interestRepo = interestRepo;
        this.imageService = imageService;
    }

    public Mono<PaginatedResponse<Event>> getAllEvents(Long organizationId, int page, int size) {
        int offset = page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        eventRepo.findEventsByOrganization(organizationId, size, offset),
                        eventRepo.countEventsByOrganization(organizationId),
                        page, size)
                    .doOnSuccess(r -> log.info("getAllEvents (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error fetching events for org {}", organizationId, error));
        }
        return PaginationHelper.paginate(
                    eventRepo.findAllEventsWithPagination(size, offset),
                    eventRepo.countAllEvents(),
                    page, size)
                .doOnSuccess(r -> log.info("getAllEvents result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching all events", error));
    }

    public Mono<PaginatedResponse<Event>> searchAllEvents(Long organizationId, String keyword, int page, int size) {
        int offset = page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        eventRepo.searchEventsByOrganization(organizationId, keyword, size, offset),
                        eventRepo.countSearchEventsByOrganization(organizationId, keyword),
                        page, size)
                    .doOnSuccess(r -> log.info("searchAllEvents (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error searching events for org {}", organizationId, error));
        }
        return PaginationHelper.paginate(
                    eventRepo.searchAllEvents(keyword, size, offset),
                    eventRepo.countSearchAllEvents(keyword),
                    page, size)
                .doOnSuccess(r -> log.info("searchAllEvents result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error searching events with keyword {}", keyword, error));
    }

    public Mono<PaginatedResponse<Event>> getEventsByPublishStatus(Long organizationId, Boolean isPublished, int page, int size) {
        int offset = page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        eventRepo.findEventsByOrganizationAndPublishStatus(organizationId, isPublished, size, offset),
                        eventRepo.countEventsByOrganizationAndPublishStatus(organizationId, isPublished),
                        page, size)
                    .doOnSuccess(r -> log.info("getEventsByPublishStatus (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error fetching events by status for org {}", organizationId, error));
        }
        return PaginationHelper.paginate(
                    eventRepo.findEventsByPublishStatus(isPublished, size, offset),
                    eventRepo.countEventsByPublishStatus(isPublished),
                    page, size)
                .doOnSuccess(r -> log.info("getEventsByPublishStatus result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching events by publish status {}", isPublished, error));
    }

    public Mono<Event> getEventById(Long eventId) {
        return eventRepo.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .doOnSuccess(e -> log.info("getEventById result: {}", JsonUtils.toJson(e)));
    }

    public Mono<Event> updateEvent(Long eventId, UpdateEventRequest request) {
        return eventRepo.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(existing -> imageService.uploadBase64IfPresent(request.getBannerBase64())
                        .defaultIfEmpty("")
                        .flatMap(bannerUrl -> {
                            existing.setTitle(request.getTitle());
                            existing.setDescription(request.getDescription());
                            existing.setBannerUrl(bannerUrl.isEmpty() ? existing.getBannerUrl() : bannerUrl);
                            existing.setLocation(request.getLocation());
                            existing.setStartTime(request.getStartTime());
                            existing.setEndTime(request.getEndTime());
                            existing.setRegistrationStartAt(request.getRegistrationStartAt());
                            existing.setRegistrationEndAt(request.getRegistrationEndAt());
                            existing.setMaxCapacity(request.getMaxCapacity());
                            return eventRepo.save(existing);
                        }))
                .doOnSuccess(e -> log.info("updateEvent result: {}", JsonUtils.toJson(e)))
                .doOnError(error -> log.error("Error updating event ID: {}", eventId, error));
    }

    public Mono<Void> deleteEvent(Long eventId) {
        return eventRepo.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepo.deleteById(eventId))
                .doOnSuccess(v -> log.info("deleteEvent: eventId={} deleted", eventId))
                .doOnError(error -> log.error("Error deleting event ID: {}", eventId, error));
    }

    public Mono<Event> publishEvent(Long eventId) {
        return eventRepo.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepo.publishEvent(eventId).then(eventRepo.findById(eventId)))
                .doOnSuccess(e -> log.info("publishEvent result: {}", JsonUtils.toJson(e)));
    }

    public Mono<Event> unpublishEvent(Long eventId) {
        return eventRepo.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepo.unpublishEvent(eventId).then(eventRepo.findById(eventId)))
                .doOnSuccess(e -> log.info("unpublishEvent result: {}", JsonUtils.toJson(e)));
    }

    public Mono<PaginatedResponse<EventTicket>> getTicketsByEvent(Long eventId, int page, int size) {
        return eventRepo.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> {
                    int offset = page * size;
                    return PaginationHelper.paginate(
                            ticketRepo.findByEventIdWithPagination(eventId, size, offset),
                            ticketRepo.countByEventId(eventId),
                            page, size);
                })
                .doOnSuccess(r -> log.info("getTicketsByEvent result: {}", JsonUtils.toJson(r)));
    }

    public Mono<EventTicket> cancelTicket(String ticketCode) {
        return ticketRepo.findByTicketCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND,
                        "Ticket not found with code: " + ticketCode)))
                .flatMap(ticket -> {
                    if (STATUS_CANCELLED.equals(ticket.getStatus().toString())) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED,
                                "Ticket already cancelled"));
                    }
                    return ticketRepo.cancelTicket(ticket.getId(), "Cancelled by admin").then(ticketRepo.findById(ticket.getId()));
                })
                .doOnSuccess(t -> log.info("cancelTicket result: {}", JsonUtils.toJson(t)));
    }

    public Mono<EventTicket> undoTicket(String ticketCode) {
        return ticketRepo.findByTicketCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND,
                        "Ticket not found with code: " + ticketCode)))
                .flatMap(ticket -> ticketRepo.undoTicket(ticket.getId()).then(ticketRepo.findById(ticket.getId())))
                .doOnSuccess(t -> log.info("undoTicket result: {}", JsonUtils.toJson(t)));
    }

    public Mono<EventTicket> banTicket(String ticketCode) {
        return ticketRepo.findByTicketCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND,
                        "Ticket not found with code: " + ticketCode)))
                .flatMap(ticket -> {
                    if ("BANNED".equals(ticket.getStatus().toString())) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED,
                                "Ticket already banned"));
                    }
                    return ticketRepo.banTicket(ticket.getId(), "Banned due to signs of fraud").then(ticketRepo.findById(ticket.getId()));
                })
                .doOnSuccess(t -> log.info("banTicket result: {}", JsonUtils.toJson(t)));
    }

    public Mono<PaginatedResponse<EventInterest>> getInterestsByEvent(Long eventId, int page, int size) {
        return eventRepo.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> {
                    int offset = page * size;
                    return PaginationHelper.paginate(
                            interestRepo.findByEventIdWithPagination(eventId, size, offset),
                            interestRepo.countByEventId(eventId),
                            page, size);
                })
                .doOnSuccess(r -> log.info("getInterestsByEvent result: {}", JsonUtils.toJson(r)));
    }

    public Mono<EventStatisticsDTO> getEventStatistics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        Mono<EventStatisticsDTO> overviewMono = eventRepo.getAggregatedEventStats(now, startOfDay, endOfDay)
                .map(stats -> EventStatisticsDTO.builder()
                        .totalEvents(stats.getTotalEvents() != null ? stats.getTotalEvents() : 0L)
                        .publishedEvents(stats.getPublishedEvents() != null ? stats.getPublishedEvents() : 0L)
                        .unpublishedEvents(stats.getUnpublishedEvents() != null ? stats.getUnpublishedEvents() : 0L)
                        .upcomingEvents(stats.getUpcomingEvents() != null ? stats.getUpcomingEvents() : 0L)
                        .ongoingEvents(stats.getOngoingEvents() != null ? stats.getOngoingEvents() : 0L)
                        .pastEvents(stats.getPastEvents() != null ? stats.getPastEvents() : 0L)
                        .newEventsToday(stats.getNewEventsToday() != null ? stats.getNewEventsToday() : 0L)
                        .build());

        Mono<long[]> ticketCountsMono = Mono.zip(
                eventRepo.getAggregatedTicketStats(),
                eventRepo.countAllInterests().defaultIfEmpty(0L)
        ).map(tuple -> {
            var stats = tuple.getT1();
            return new long[]{
                stats.getTotalTickets() != null ? stats.getTotalTickets() : 0L,
                stats.getRegisteredTickets() != null ? stats.getRegisteredTickets() : 0L,
                stats.getCheckedInTickets() != null ? stats.getCheckedInTickets() : 0L,
                stats.getCancelledTickets() != null ? stats.getCancelledTickets() : 0L,
                tuple.getT2()
            };
        });

        Mono<List<EventStatisticsDTO.EventSummary>> topByRegistrationMono =
                eventRepo.findTopEventsByRegistrationSummary(5)
                        .collectList()
                        .defaultIfEmpty(Collections.emptyList());

        Mono<List<EventStatisticsDTO.EventSummary>> topByInterestMono =
                eventRepo.findTopEventsByInterestSummary(5)
                        .collectList()
                        .defaultIfEmpty(Collections.emptyList());

        return Mono.zip(overviewMono, ticketCountsMono, topByRegistrationMono, topByInterestMono)
                .map(tuple -> {
                    EventStatisticsDTO stats = tuple.getT1();
                    long[] counts = tuple.getT2();
                    stats.setTotalTickets(counts[0]);
                    stats.setRegisteredTickets(counts[1]);
                    stats.setCheckedInTickets(counts[2]);
                    stats.setCancelledTickets(counts[3]);
                    stats.setTotalInterests(counts[4]);
                    stats.setTopEventsByRegistration(tuple.getT3());
                    stats.setTopEventsByInterest(tuple.getT4());
                    return stats;
                })
                .doOnSuccess(s -> log.info("getEventStatistics result: {}", JsonUtils.toJson(s)))
                .doOnError(error -> log.error("Error fetching event statistics", error));
    }


}
