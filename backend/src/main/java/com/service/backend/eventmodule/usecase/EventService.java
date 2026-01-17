package com.service.backend.eventmodule.usecase;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.domain.repository.IEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Service layer for event management operations
 */
@Service
@RequiredArgsConstructor
public class EventService {

    private final IEventRepository eventRepository;
}
