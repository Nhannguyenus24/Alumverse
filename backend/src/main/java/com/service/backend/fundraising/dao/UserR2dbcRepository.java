package com.service.backend.fundraising.dao;

import com.service.backend.fundraising.entity.User;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserR2dbcRepository extends R2dbcRepository<User, Integer> {
}
