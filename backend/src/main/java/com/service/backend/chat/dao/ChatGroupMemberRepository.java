package com.service.backend.chat.dao;

import com.service.backend.shared.entity.ChatGroupMember;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ChatGroupMemberRepository extends ReactiveCrudRepository<ChatGroupMember, Long> {

    @Query("SELECT * FROM chat_group_members WHERE member_id = :memberId")
    Flux<ChatGroupMember> findByMemberId(Long memberId);

    @Query("SELECT * FROM chat_group_members WHERE group_id = :groupId")
    Flux<ChatGroupMember> findByGroupId(Long groupId);

    @Query("SELECT * FROM chat_group_members WHERE group_id = :groupId AND member_id = :memberId LIMIT 1")
    Mono<ChatGroupMember> findByGroupIdAndMemberId(Long groupId, Long memberId);

    @Modifying
    @Query("DELETE FROM chat_group_members WHERE group_id = :groupId AND member_id = :memberId")
    Mono<Void> deleteByGroupIdAndMemberId(Long groupId, Long memberId);

    @Modifying
    @Query("DELETE FROM chat_group_members WHERE group_id = :groupId")
    Mono<Void> deleteByGroupId(Long groupId);
}


