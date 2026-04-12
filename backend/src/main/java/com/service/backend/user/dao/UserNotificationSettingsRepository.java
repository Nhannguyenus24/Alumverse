package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.user.entity.UserNotificationSettings;

@Repository
public interface UserNotificationSettingsRepository extends R2dbcRepository<UserNotificationSettings, Integer> {
}
