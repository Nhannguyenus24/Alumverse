package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminEventRepository;
import com.service.backend.admin.dto.EventStatisticsDTO;
import com.service.backend.event.dao.EventInterestR2dbcRepository;
import com.service.backend.event.dao.EventR2dbcRepository;
import com.service.backend.event.dao.EventTicketR2dbcRepository;
import com.service.backend.event.dto.UpdateEventRequest;
import com.service.backend.event.entity.Event;
import com.service.backend.event.entity.EventInterest;
import com.service.backend.event.entity.EventTicket;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
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

    private final AdminEventRepository adminEventRepository;
    private final EventR2dbcRepository eventRepo;
    private final EventTicketR2dbcRepository ticketRepo;
    private final EventInterestR2dbcRepository interestRepo;
    private final ImageService imageService;

    public AdminEventService(AdminEventRepository adminEventRepository,
                             EventR2dbcRepository eventRepo,
                             EventTicketR2dbcRepository ticketRepo,
                             EventInterestR2dbcRepository interestRepo,
                             ImageService imageService) {
        this.adminEventRepository = adminEventRepository;
        this.eventRepo = eventRepo;
        this.ticketRepo = ticketRepo;
        this.interestRepo = interestRepo;
        this.imageService = imageService;
    }

    public Mono<PaginatedResponse<Event>> getAllEvents(int page, int size) {
        log.info("Admin fetching all events - page: {}, size: {}", page, size);
        int offset = page * size;
        return adminEventRepository.findAllEventsWithPagination(size, offset)
                .collectList()
                .zipWith(adminEventRepository.countAllEvents())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error fetching all events", error));
    }

    public Mono<PaginatedResponse<Event>> getEventsByOrganization(Long organizationId, int page, int size) {
        log.info("Admin fetching events for organization {} - page: {}, size: {}", organizationId, page, size);
        int offset = page * size;
        return adminEventRepository.findEventsByOrganization(organizationId, size, offset)
                .collectList()
                .zipWith(adminEventRepository.countEventsByOrganization(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error fetching events for organization {}", organizationId, error));
    }

    public Mono<PaginatedResponse<Event>> searchAllEvents(String keyword, int page, int size) {
        log.info("Admin searching all events with keyword '{}' - page: {}, size: {}", keyword, page, size);
        int offset = page * size;
        return adminEventRepository.searchAllEvents(keyword, size, offset)
                .collectList()
                .zipWith(adminEventRepository.countSearchAllEvents(keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error searching events with keyword {}", keyword, error));
    }

    public Mono<PaginatedResponse<Event>> getEventsByPublishStatus(Boolean isPublished, int page, int size) {
        log.info("Admin fetching events by publish status {} - page: {}, size: {}", isPublished, page, size);
        int offset = page * size;
        return adminEventRepository.findEventsByPublishStatus(isPublished, size, offset)
                .collectList()
                .zipWith(adminEventRepository.countEventsByPublishStatus(isPublished))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error fetching events by publish status {}", isPublished, error));
    }

    public Mono<Event> getEventById(Long eventId) {
        log.info("Admin fetching event ID: {}", eventId);
        return adminEventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)));
    }

    public Mono<Event> updateEvent(Long eventId, UpdateEventRequest request) {
        log.info("Admin updating event ID: {}", eventId);
        return adminEventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(existing -> imageService.uploadBase64IfPresent(request.getBannerBase64())
                        .defaultIfEmpty(request.getBannerUrl() == null ? "" : request.getBannerUrl())
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
                .doOnSuccess(e -> log.info("Admin successfully updated event ID: {}", eventId))
                .doOnError(error -> log.error("Error updating event ID: {}", eventId, error));
    }

    public Mono<Void> deleteEvent(Long eventId) {
        log.info("Admin deleting event ID: {}", eventId);
        return adminEventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepo.deleteById(eventId))
                .doOnSuccess(v -> log.info("Admin successfully deleted event ID: {}", eventId))
                .doOnError(error -> log.error("Error deleting event ID: {}", eventId, error));
    }

    public Mono<Event> publishEvent(Long eventId) {
        log.info("Admin publishing event ID: {}", eventId);
        return adminEventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepo.publishEvent(eventId).then(eventRepo.findById(eventId)));
    }

    public Mono<Event> unpublishEvent(Long eventId) {
        log.info("Admin unpublishing event ID: {}", eventId);
        return adminEventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepo.unpublishEvent(eventId).then(eventRepo.findById(eventId)));
    }

    public Mono<PaginatedResponse<EventTicket>> getTicketsByEvent(Long eventId, int page, int size) {
        log.info("Admin fetching tickets for event {} - page: {}, size: {}", eventId, page, size);
        return adminEventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> {
                    int offset = page * size;
                    return ticketRepo.findByEventIdWithPagination(eventId, size, offset)
                            .collectList()
                            .zipWith(ticketRepo.countByEventId(eventId))
                            .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
                });
    }

    public Mono<EventTicket> cancelTicket(String ticketCode) {
        log.info("Admin cancelling ticket with code: {}", ticketCode);
        return ticketRepo.findByTicketCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND,
                        "Ticket not found with code: " + ticketCode)))
                .flatMap(ticket -> {
                    if (STATUS_CANCELLED.equals(ticket.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED,
                                "Ticket already cancelled"));
                    }
                    return ticketRepo.cancelTicket(ticket.getId()).then(ticketRepo.findById(ticket.getId()));
                });
    }

    public Mono<PaginatedResponse<EventInterest>> getInterestsByEvent(Long eventId, int page, int size) {
        log.info("Admin fetching interests for event {} - page: {}, size: {}", eventId, page, size);
        return adminEventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND,
                        "Event not found with id: " + eventId)))
                .flatMap(event -> {
                    int offset = page * size;
                    return interestRepo.findByEventIdWithPagination(eventId, size, offset)
                            .collectList()
                            .zipWith(interestRepo.countByEventId(eventId))
                            .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
                });
    }

    public Mono<EventStatisticsDTO> getEventStatistics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        Mono<Long> totalEvents = adminEventRepository.countAllEvents().defaultIfEmpty(0L);
        Mono<Long> publishedEvents = adminEventRepository.countPublishedEvents().defaultIfEmpty(0L);
        Mono<Long> unpublishedEvents = adminEventRepository.countUnpublishedEvents().defaultIfEmpty(0L);
        Mono<Long> upcomingEvents = adminEventRepository.countUpcomingEvents(now).defaultIfEmpty(0L);
        Mono<Long> ongoingEvents = adminEventRepository.countOngoingEvents(now).defaultIfEmpty(0L);
        Mono<Long> pastEvents = adminEventRepository.countPastEvents(now).defaultIfEmpty(0L);
        Mono<Long> newEventsToday = adminEventRepository.countEventsCreatedToday(startOfDay, endOfDay).defaultIfEmpty(0L);

        Mono<EventStatisticsDTO> overviewMono = Mono.zip(
                List.of(totalEvents, publishedEvents, unpublishedEvents, upcomingEvents,
                        ongoingEvents, pastEvents, newEventsToday),
                arr -> EventStatisticsDTO.builder()
                        .totalEvents((Long) arr[0])
                        .publishedEvents((Long) arr[1])
                        .unpublishedEvents((Long) arr[2])
                        .upcomingEvents((Long) arr[3])
                        .ongoingEvents((Long) arr[4])
                        .pastEvents((Long) arr[5])
                        .newEventsToday((Long) arr[6])
                        .build());

        Mono<long[]> ticketCountsMono = Mono.zip(
                adminEventRepository.countAllTickets().defaultIfEmpty(0L),
                adminEventRepository.countTicketsByStatus(STATUS_REGISTERED).defaultIfEmpty(0L),
                adminEventRepository.countTicketsByStatus(STATUS_CHECKED_IN).defaultIfEmpty(0L),
                adminEventRepository.countTicketsByStatus(STATUS_CANCELLED).defaultIfEmpty(0L),
                adminEventRepository.countAllInterests().defaultIfEmpty(0L)
        ).map(tuple -> new long[]{tuple.getT1(), tuple.getT2(), tuple.getT3(), tuple.getT4(), tuple.getT5()});

        Mono<List<EventStatisticsDTO.EventSummary>> topByRegistrationMono =
                adminEventRepository.findTopEventsByRegistration(5)
                        .concatMap(this::toEventSummaryWithRegisteredCount)
                        .collectList()
                        .defaultIfEmpty(Collections.emptyList());

        Mono<List<EventStatisticsDTO.EventSummary>> topByInterestMono =
                adminEventRepository.findTopEventsByInterest(5)
                        .concatMap(this::toEventSummaryWithRegisteredCount)
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
                .doOnSuccess(s -> log.info("Successfully retrieved event statistics"))
                .doOnError(error -> log.error("Error fetching event statistics", error));
    }

    private Mono<EventStatisticsDTO.EventSummary> toEventSummaryWithRegisteredCount(Event event) {
        return Flux.merge(
                ticketRepo.countByEventIdAndStatus(event.getId(), STATUS_REGISTERED),
                ticketRepo.countByEventIdAndStatus(event.getId(), STATUS_CHECKED_IN)
        ).reduce(0L, Long::sum)
                .defaultIfEmpty(0L)
                .map(registeredCount -> EventStatisticsDTO.EventSummary.builder()
                        .eventId(event.getId())
                        .organizationId(event.getOrganizationId())
                        .title(event.getTitle())
                        .location(event.getLocation())
                        .startTime(event.getStartTime())
                        .endTime(event.getEndTime())
                        .interestedCount(event.getInterestedCount())
                        .registeredCount(registeredCount)
                        .isPublished(event.getIsPublished())
                        .build());
    }
}
