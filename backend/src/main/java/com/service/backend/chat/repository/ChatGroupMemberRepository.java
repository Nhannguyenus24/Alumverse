package com.service.backend.chat.repository;

import com.service.backend.chat.entity.ChatGroupMember;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ChatGroupMemberRepository extends ReactiveCrudRepository<ChatGroupMember, Long> {

    @Query("SELECT * FROM chat_group_members WHERE member_id = :memberId")
    Flux<ChatGroupMember> findByMemberId(Long memberId);

    @Query("SELECT * FROM chat_group_members WHERE group_id = :groupId")
    Flux<ChatGroupMember> findByGroupId(Long groupId);
}

