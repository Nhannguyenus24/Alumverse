package com.service.backend.eventmodule.dao;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.domain.repository.IEventRepository;
import org.springframework.stereotype.Repository;

/**
 * Infrastructure implementation for event repository
 * This class will implement IEventRepository using R2DBC
 */
@Repository
public class EventRepository //implements IEventRepository
{
}
