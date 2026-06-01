package com.service.backend.chat.dao;

import com.service.backend.chat.entity.ChatGroup;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ChatGroupRepository extends ReactiveCrudRepository<ChatGroup, Long> {


    @Query("""
            SELECT cg.*
            FROM chat_groups cg
            WHERE cg.type = 'PRIVATE'
              AND cg.id IN (
                  SELECT group_id
                  FROM chat_group_members
                  WHERE member_id IN (:memberAId, :memberBId)
                  GROUP BY group_id
                  HAVING COUNT(*) = 2
              )
            LIMIT 1
            """)
    Mono<ChatGroup> findPrivateChatBetweenMembers(Long memberAId, Long memberBId);
}

