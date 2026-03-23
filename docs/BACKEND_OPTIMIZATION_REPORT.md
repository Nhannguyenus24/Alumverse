# Backend Architecture Review & Redesign — AlumVerse

> **Reviewer**: Senior Backend Architect
> **Date**: March 2026
> **Stack**: Spring Boot 3.5.9 · WebFlux · R2DBC · PostgreSQL · Spring Security + JWT
> **Architecture**: Modular Monolith

---

## Table of Contents

1. [Executive Summary: Critical Findings](#1-executive-summary-critical-findings)
2. [Ideal Project Structure](#2-ideal-project-structure)
3. [Module-by-Module Review](#3-module-by-module-review)
4. [Spring Security Redesign](#4-spring-security-redesign)
5. [RBAC Design](#5-rbac-design)
6. [Logging Strategy](#6-logging-strategy)
7. [Reactive Programming Evaluation](#7-reactive-programming-evaluation)
8. [Database Optimization](#8-database-optimization)
9. [Exception Handling Redesign](#9-exception-handling-redesign)
10. [Configuration Management](#10-configuration-management)
11. [Scaling Considerations](#11-scaling-considerations-millions-of-users)
12. [CI/CD & Testing Strategy](#12-cicd--testing-strategy)
13. [Priority Action Items](#13-priority-action-items)

---

## 1. Executive Summary: Critical Findings

| Severity | Finding | Impact |
|----------|---------|--------|
| **CRITICAL** | Security is disabled (`anyExchange().permitAll()`) | Any endpoint is publicly accessible |
| **CRITICAL** | Hardcoded MOCK IDs in 8+ services | All operations run as user ID 1, no real auth context |
| **CRITICAL** | Credentials committed to source (`application.properties`) | JWT secret, mail password, DB password exposed |
| **HIGH** | `@RequireRole` annotation has no enforcement handler | RBAC is declared but never executed |
| **HIGH** | No database migration tool (Flyway/Liquibase) | Schema drift, no version control for DB |
| **HIGH** | Missing indexes on FK columns | Full table scans on all JOIN queries |
| **HIGH** | No tests beyond `contextLoads()` | Zero confidence in refactoring safety |
| **MEDIUM** | Inconsistent architecture across modules | Maintenance burden, cognitive overhead |
| **MEDIUM** | God service pattern (ForumService ~466 lines) | Hard to test, hard to extend |
| **MEDIUM** | Fire-and-forget `.subscribe()` in ForumService | Lost errors, potential data inconsistency |

---

## 2. Ideal Project Structure

### Current Problem: Three Conflicting Styles

The codebase has **three different architectural styles** coexisting:

- `article/`, `eventmodule/`, `mentorship/` use a **Clean Architecture** variant (`dao/`, `domain/entity/`, `presentation/`, `usecase/`)
- `forum/`, `admin/`, `chat/` use a **traditional layered** style (`controller/`, `service/`, `repository/`, `entities/`)
- `auth/` uses yet another variant (`controller/`, `service/`, `repository/`, `entity/`)

This inconsistency creates cognitive overhead. Pick one and enforce it everywhere.

### Recommended Structure: Clean Architecture (Adapted)

Standardize on the Clean Architecture variant already started in `eventmodule`, but simplified:

```
backend/src/main/java/com/service/backend/
├── Application.java
│
├── auth/                           # Auth module
│   ├── domain/
│   │   ├── entity/User.java
│   │   └── repository/AuthRepository.java     # Interface only
│   ├── application/                            # Use cases / services
│   │   ├── AuthService.java
│   │   └── TokenService.java                   # Extract from AuthService
│   ├── infrastructure/
│   │   ├── persistence/AuthR2dbcRepository.java
│   │   └── security/JwtProvider.java           # Move from shared
│   └── presentation/
│       ├── controller/AuthController.java
│       └── dto/
│           ├── request/
│           └── response/
│
├── event/                          # Event module
│   ├── domain/
│   │   ├── entity/
│   │   └── repository/            # Port (interface)
│   ├── application/               # Use cases
│   ├── infrastructure/
│   │   └── persistence/           # Adapter (implementation)
│   └── presentation/
│       ├── controller/
│       └── dto/
│
├── forum/                          # Forum module (same pattern)
├── article/                        # Article module
├── chat/                           # Chat module
├── mentorship/                     # Mentorship module
├── admin/                          # Admin module
│
└── shared/                         # Cross-cutting concerns ONLY
    ├── config/
    │   ├── SecurityConfig.java
    │   ├── R2dbcConfig.java
    │   └── CacheConfig.java
    ├── security/
    │   ├── JwtAuthenticationFilter.java
    │   ├── RequireRole.java
    │   └── RequireRoleAspect.java
    ├── exception/
    │   ├── ApplicationException.java
    │   ├── GlobalExceptionHandler.java
    │   └── ErrorCode.java
    ├── dto/
    │   ├── ApiResponse.java
    │   └── PaginatedResponse.java     # ONE shared, not 3 copies
    ├── logging/
    │   ├── CorrelationIdFilter.java
    │   └── RequestLoggingFilter.java
    └── util/
        ├── SecurityUtils.java
        └── TimeUtils.java
```

### Module Boundary Rules

1. **No module imports another module's internals.** If `event` needs user data, it calls through a shared interface or uses the user ID from security context — never imports `auth.entity.User`.
2. **`shared/` contains only truly cross-cutting concerns** — not business logic. Currently `shared/utils/CacheUtils.java` is fine, but `JwtUtils` should be under `shared/security/` or `auth/infrastructure/`.
3. **Each module owns its own `PaginatedResponse`** OR everyone uses the one in `shared/dto/`. Currently there are three separate `PaginatedResponse` classes (event, article, mentorship) — consolidate.

---

## 3. Module-by-Module Deep Review

> For each module: file-level code review, specific bugs found, anti-patterns, and concrete refactoring.

---

### 3.1 Auth Module

**Files**: `AuthController`, `AuthService`, `AuthRepository`, `User`, `AuthConstants`, 6 DTOs

**Responsibility**: Registration, login (email/username), OTP verification, token refresh, password change.

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **Password hash leaked in logs** | CRITICAL | `AuthService.java:77` | `logger.info(JsonUtils.toJson(user))` serializes the FULL User object (including `passwordHash`) to INFO log on failed login |
| 2 | **Entity type mismatch** | HIGH | `User.java:48` | `updatedAt` field is `String` but database column is `timestamp` — causes silent mapping issues |
| 3 | **Password hashing blocks event loop** | HIGH | `AuthService.java:61` | `passwordEncoder.encode(password)` is CPU-intensive BCrypt — called synchronously on the event loop thread |
| 4 | **Controller contains business logic** | HIGH | `AuthController.java:66-88` | Login fallback logic (email → username), token generation, cookie creation are all in the controller |
| 5 | **Misleading DTO field name** | MEDIUM | `LoginRequest.java:21` | Field is called `email` but actually accepts username too — confusing contract |
| 6 | **Hardcoded role on registration** | MEDIUM | `AuthRepository.java:93` | All users register as `'alumni'` — no way to register as `student` or other roles |
| 7 | **SRP violation** | MEDIUM | `AuthService.java` | Single service handles auth + OTP + token generation + org lookup |
| 8 | **RuntimeException everywhere** | MEDIUM | `AuthService.java:58-59` | Uses `RuntimeException` instead of `ApplicationException` — all errors become HTTP 500 |
| 9 | **OTP not evicted after verification** | LOW | `AuthService.java:187` | Verified OTP stays in cache until TTL expires — could be reused |
| 10 | **Unused repository methods** | LOW | `AuthRepository.java:52-63` | `findByEmailAndPassword`, `findByUsernameAndPassword` compare plain hash — never called, dangerous if used |
| 11 | **Fat JWT token** | MEDIUM | `JwtUtils.java:31-37` | Embeds email, role, username, avatar, organizationId list — avatar changes require token re-issue |
| 12 | **No refresh token revocation** | HIGH | `AuthService.java:196` | Refresh tokens cannot be invalidated — if leaked, valid until expiry |

#### Bug #1 — Password Hash Leaked in Logs (CRITICAL)

```java
// AuthService.java:77 — on failed password match, ENTIRE user object is logged
if (passwordEncoder.matches(password, user.getPasswordHash())) {
    logger.info("Login successful for email: {}", email);
    return Mono.just(user);
}
logger.info(JsonUtils.toJson(user));  // LEAKS password_hash to logs!
```

This serializes the `User` object including `passwordHash` to application logs. Anyone with log access can see password hashes.

**Fix**: Remove this line entirely. If debugging is needed, log only `user.getId()`.

#### Bug #2 — Entity Type Mismatch

```java
// User.java:48 — String type for a timestamp column
@Column("updated_at")
private String updatedAt;  // Should be LocalDateTime
```

The DB column is `timestamp` but the entity field is `String`. This causes R2DBC to convert timestamps to strings, losing type safety and making comparisons unreliable.

**Fix**:

```java
@Column("updated_at")
private LocalDateTime updatedAt;
```

> Note: This also breaks `UserResponse` in the admin module which maps `updatedAt` as `LocalDateTime` — it will fail at runtime.

#### Bug #3 — BCrypt Blocks Event Loop

```java
// AuthService.java:61 — synchronous CPU-heavy operation
String hashedPassword = passwordEncoder.encode(password);
```

BCrypt is intentionally slow (10+ rounds). On the Netty event loop, this blocks the thread serving ALL concurrent requests.

**Fix**:

```java
return Mono.fromCallable(() -> passwordEncoder.encode(password))
    .subscribeOn(Schedulers.boundedElastic())
    .flatMap(hashedPassword ->
        authRepository.registerNewUser(email, userName, hashedPassword));
```

Same fix needed in `changePassword` (line 121) and `loginByEmail`/`loginByUserName` where `passwordEncoder.matches()` is called.

#### Anti-Pattern — Controller as Orchestrator

`AuthController.login` contains 25+ lines of business logic:

```java
// AuthController.java:66-88 — login method does too much
return authService.loginByEmail(request.getEmail(), request.getPassword())
    .switchIfEmpty(Mono.defer(() ->
        authService.loginByUserName(request.getEmail(), request.getPassword())
    ))
    .flatMap(user ->
        authService.getOrganizationIdByUserId(user.getId())
            .defaultIfEmpty(List.of())
            .map(organizationId -> {
                String accessToken = jwtUtils.generateAccessToken(/*...*/);
                String refreshToken = jwtUtils.generateRefreshToken(user.getId());
                ResponseCookie refreshTokenCookie = ResponseCookie.from(/*...*/);
                // ... builds response
            })
    )
```

The controller decides login strategy, generates tokens, creates cookies. This should all be in the service layer.

#### Refactoring — Split into TokenService + AuthService

```java
// TokenService.java — single responsibility for token operations
@Service
public class TokenService {
    private final JwtProvider jwtProvider;

    public Mono<TokenPair> issueTokens(User user) {
        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getRole());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());
        return Mono.just(new TokenPair(accessToken, refreshToken));
    }

    public Mono<String> refreshAccessToken(String refreshToken) { /* ... */ }
}

// AuthService.java — authentication only
@Service
public class AuthService {
    public Mono<User> authenticate(String identifier, String password) {
        return authRepository.findByEmailOrUserName(identifier)
            .switchIfEmpty(Mono.error(
                new ApplicationException(ErrorCode.USER_NOT_FOUND, "User not found")))
            .flatMap(user ->
                Mono.fromCallable(() -> passwordEncoder.matches(password, user.getPasswordHash()))
                    .subscribeOn(Schedulers.boundedElastic())
                    .flatMap(matches -> matches
                        ? Mono.just(user)
                        : Mono.error(new ApplicationException(
                            ErrorCode.INVALID_PASSWORD, "Invalid credentials")))
            );
    }
}
```

---

### 3.2 Event Module

**Files**: `EventController`, `EventService`, `EventRepository`, `IEventRepository`, 3 R2DBC repos, 3 entities, 6 DTOs

**Responsibility**: Event lifecycle, ticketing, interest tracking, statistics.

**Verdict**: Best-structured module architecturally — uses Clean Architecture with `IEventRepository` as a port and `EventRepository` as adapter.

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **MOCK IDs hardcoded** | CRITICAL | `EventService.java:24-25` | `MOCK_MEMBER_ID = 1L`, `MOCK_ORGANIZATION_ID = 1L` used in every method |
| 2 | **Race condition on ticket registration** | HIGH | `EventService.java:129-151` | Capacity check + register is not atomic — two concurrent requests can both pass the check |
| 3 | **No ownership checks** | HIGH | `EventService.java:45-68` | Any user can update/delete any event, publish/unpublish, cancel any ticket |
| 4 | **Ticket code collision risk** | MEDIUM | `EventRepository.java:145` | `UUID.randomUUID().substring(0, 8)` — only 8 hex chars = ~4 billion values, but birthday paradox means collisions at ~65K tickets |
| 5 | **Full overwrite on update** | MEDIUM | `EventService.java:48-59` | `UpdateEventRequest` has `@NotBlank`/`@NotNull` on all fields — partial update impossible |
| 6 | **Event deletion without cascade** | MEDIUM | `EventRepository.java:40` | `deleteById` doesn't clean up related tickets/interests — FK constraint failure |
| 7 | **Double query on publish/unpublish** | LOW | `EventRepository.java:71-72` | Does `UPDATE` then `findById` — 2 queries instead of returning updated row |
| 8 | **Search uses LIKE** | LOW | `EventR2dbcRepository.java` | `LIKE LOWER(CONCAT('%', :keyword, '%'))` prevents index usage — full table scan |

#### Bug #2 — Race Condition on Ticket Registration

```java
// EventService.java:141-148 — non-atomic check-then-act
if (event.getMaxCapacity() != null && event.getMaxCapacity() > 0) {
    return eventRepository.countRegisteredTickets(eventId)  // Step 1: count
        .flatMap(count -> {
            if (count >= event.getMaxCapacity()) {
                return Mono.error(/*...*/);
            }
            return eventRepository.registerTicket(ticket);  // Step 2: insert
        });
}
```

Two concurrent requests both execute Step 1 at count=299 (max=300), both pass the check, both execute Step 2, resulting in 301 tickets.

**Fix**: Use a database-level constraint or `SELECT FOR UPDATE`:

```sql
-- In EventRepository, use a single atomic query:
INSERT INTO event_tickets (event_id, member_id, ticket_code, status, registered_at)
SELECT :eventId, :memberId, :ticketCode, 'REGISTERED', NOW()
WHERE (SELECT COUNT(*) FROM event_tickets WHERE event_id = :eventId AND status = 'REGISTERED')
      < (SELECT max_capacity FROM events WHERE id = :eventId)
```

#### Bug #4 — Ticket Code Collision

```java
// EventRepository.java:145
ticketData.setTicketCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
```

8 hex characters = 16^8 = ~4.3 billion combinations. By the birthday paradox, at ~65,000 tickets you have a 50% chance of collision, and the `ticket_code` column has a UNIQUE constraint — the insert will fail silently.

**Fix**: Use the full UUID or a structured code like `EVT-{eventId}-{sequence}`.

#### Refactoring — Pass Auth Context

```java
// EventService — every method should accept the authenticated user
public Mono<Event> createEvent(CreateEventRequest request, Long memberId, Long organizationId) {
    Event event = Event.builder()
        .creatorMemberId(memberId)
        .organizationId(organizationId)
        // ...
        .build();
    return eventRepository.createEvent(event);
}

// EventController — extract from security context
@PostMapping
public Mono<ResponseEntity<ApiResponse<Event>>> createEvent(
        @Valid @RequestBody CreateEventRequest request) {
    return SecurityUtils.getCurrentUserId()
        .flatMap(userId -> eventService.createEvent(request, userId, /* orgId from context */));
}
```

---

### 3.3 Forum Module

**Files**: `ForumController`, `ForumService`, 4 repositories, 4 entities, 12 DTOs

**Responsibility**: Categories, topics, posts, reactions.

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **Fire-and-forget `.subscribe()`** | HIGH | `ForumService.java:223-228` | Orphaned subscription for view count increment — errors silently lost |
| 2 | **Exception as flow control** | HIGH | `ForumService.java:365` | `RuntimeException("REACTION_REMOVED")` used to signal successful unlike — controller checks `error.getMessage()` |
| 3 | **God Service** | HIGH | `ForumService.java` | 466 lines handling 4 distinct domains: categories, topics, posts, reactions |
| 4 | **No auth context** | HIGH | `CreateForumPostRequest` | `authorMemberId` comes from request body, not security context — users can impersonate others |
| 5 | **No ownership checks** | HIGH | All CRUD methods | Any user can update/delete any category, topic, or post |
| 6 | **Missing entity field** | MEDIUM | `ForumCategory.java` | Database has `parent_id` column but entity doesn't map it — hierarchical categories are broken |
| 7 | **Hard delete cascades** | MEDIUM | `ForumService.java:119-124` | `deleteCategory` doesn't check for child topics — FK violation at runtime |
| 8 | **All errors become 500** | MEDIUM | `ForumController.java` | Every `.onErrorResume` maps to `HttpStatus.INTERNAL_SERVER_ERROR` — even for "not found" |
| 9 | **Controller string matching on errors** | MEDIUM | `ForumController.java:237-242` | `if ("REACTION_REMOVED".equals(error.getMessage()))` — fragile string check |
| 10 | **Excessive INFO logging** | LOW | `ForumService.java` | Every method logs entry + success at INFO — 2x log lines per request |

#### Bug #1 — Fire-and-Forget `.subscribe()`

```java
// ForumService.java:223-228
forumTopicRepository.incrementViewCount(topicId)
    .onErrorResume(error -> {
        log.warn("Failed to increment view count for topic ID: {}", topicId, error);
        return Mono.empty();
    })
    .subscribe();  // Orphaned subscription!
```

**Fix** — compose into the reactive chain:

```java
Mono<Void> viewCountUpdate = forumTopicRepository.incrementViewCount(topicId)
    .onErrorResume(error -> {
        log.warn("Failed to increment view count for topic {}", topicId);
        return Mono.empty();
    }).then();

return Mono.zip(postsMono, countMono, likedPostIdsMono,
                viewCountUpdate.then(Mono.just(true)))
    .map(tuple -> { /* build response */ });
```

#### Bug #2 — Exception as Flow Control

The reaction toggle throws a `RuntimeException` to signal success:

```java
// ForumService.java:365 — throws exception on SUCCESS
return forumPostReactionRepository.deleteByPostIdAndMemberId(
        request.getPostId(), request.getMemberId())
    .then(Mono.<ForumPostReaction>error(new RuntimeException("REACTION_REMOVED")));

// ForumController.java:237-242 — catches "success" exception
.onErrorResume(error -> {
    if ("REACTION_REMOVED".equals(error.getMessage())) {
        return Mono.just(ResponseEntity.ok(
            new ApiResponse<>("Like removed successfully", null)));
    }
    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)/*...*/);
});
```

**Fix** — return a proper discriminated response:

```java
// ReactionResult.java — new type
public record ReactionResult(boolean removed, ForumPostReactionDTO reaction) {
    public static ReactionResult removed() { return new ReactionResult(true, null); }
    public static ReactionResult added(ForumPostReactionDTO r) { return new ReactionResult(false, r); }
}

// ForumPostService.java — clean logic
public Mono<ReactionResult> reactToPost(CreateForumPostReactionRequest request) {
    return forumPostReactionRepository
        .findByPostIdAndMemberId(request.getPostId(), request.getMemberId())
        .flatMap(existing -> forumPostReactionRepository
            .deleteByPostIdAndMemberId(request.getPostId(), request.getMemberId())
            .thenReturn(ReactionResult.removed()))
        .switchIfEmpty(Mono.defer(() -> {
            ForumPostReaction reaction = ForumPostReaction.builder()/* ... */.build();
            return forumPostReactionRepository.save(reaction)
                .map(saved -> ReactionResult.added(convertToReactionDTO(saved)));
        }));
}
```

#### Bug #4 — Client Can Impersonate Any User

```java
// CreateForumPostRequest.java — authorMemberId is a CLIENT-supplied field
@NotNull(message = "Author member ID is required")
@Min(value = 1, message = "Author member ID must be greater than 0")
private Integer authorMemberId;
```

Any client can set `authorMemberId` to any value and create posts as another user.

**Fix**: Remove `authorMemberId` from the DTO. Extract it from `SecurityUtils.getCurrentUserId()` in the controller or service.

#### Bug #6 — Missing `parent_id` in Entity

The database schema has:

```sql
CREATE TABLE "forum_categories" (
    "parent_id" integer DEFAULT NULL,
    -- ...
);
```

But `ForumCategory.java` doesn't map this column — hierarchical category features are silently broken.

#### Refactoring — Split God Service

| New Service | Methods | Lines |
|------------|---------|-------|
| `ForumCategoryService` | findAll, create, update, delete | ~80 |
| `ForumTopicService` | findByTitle, findByCategory, create, update, delete | ~120 |
| `ForumPostService` | findByTopic, create, ban, unban, delete, answer, react, getReactions | ~200 |

---

### 3.4 Article Module (News, Jobs, Achievements, LearningResources)

**Files**: 5 controllers, 5 services, 5 repositories, 5 entities, 16 DTOs

**Responsibility**: CRUD for four article types + saved items.

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **MOCK IDs in all 5 services** | CRITICAL | Every service | `MOCK_ORGANIZATION_ID = 1`, `MOCK_POSTER_MEMBER_ID = 1`, `MOCK_MEMBER_ID = 1` |
| 2 | **Duplicate `PaginatedResponse`** | MEDIUM | `article/dto/response/PaginatedResponse.java` | Identical copy of event module's version — 3 copies in codebase |
| 3 | **Full overwrite on update** | MEDIUM | All update methods | `existing.setTitle(request.getTitle())` — if client sends null, field becomes null |
| 4 | **No slug auto-generation** | MEDIUM | `NewsService.java:30` | Accepts slug from client — no validation for uniqueness or auto-generation |
| 5 | **No content sanitization** | MEDIUM | All services | HTML `content` fields accept any input — XSS risk when rendered |
| 6 | **Four nearly identical services** | LOW | All article services | Same CRUD + pagination pattern copy-pasted across Job, News, Achievement, LearningResource |

#### Anti-Pattern — Copy-Paste Services

`JobService`, `NewsService`, `AchievementService`, `LearningResourceService` all follow this exact pattern:

```java
// Every single article service follows this identical skeleton:
public Mono<XResponse> create(CreateXRequest request) {
    X entity = X.builder()
        .organizationId(MOCK_ORGANIZATION_ID)
        .posterMemberId(MOCK_POSTER_MEMBER_ID)
        /* ... fields from request ... */
        .build();
    return repository.save(entity).map(XResponse::from);
}

public Mono<XResponse> update(Integer id, UpdateXRequest request) {
    return repository.findById(id)
        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.X_NOT_FOUND, "...")))
        .flatMap(existing -> { /* set all fields */ return repository.save(existing); })
        .map(XResponse::from);
}

public Mono<Boolean> delete(Integer id) { /* same pattern */ }
public Mono<XResponse> getById(Integer id) { /* same pattern */ }
public Mono<PaginatedResponse<XResponse>> getAll(int page, int limit) { /* same pattern */ }
public Mono<PaginatedResponse<XResponse>> search(String keyword, int page, int limit) { /* same pattern */ }
```

**Refactoring option**: If the pattern is truly identical, extract a `BaseCrudService<E, ID, CreateReq, UpdateReq, Resp>` that handles common CRUD + pagination. Each article service only overrides entity-specific mapping. But only if this reduces total code — don't abstract prematurely.

#### Bug — Null Overwrites on Update

```java
// JobService.java:44-52 — ALL fields overwritten unconditionally
existing.setTitle(request.getTitle());
existing.setDescription(request.getDescription());
existing.setCompanyName(request.getCompanyName());
existing.setLocation(request.getLocation());
// If client sends {"title": "New"} without other fields, they ALL become null
```

**Fix**: Only set fields that are non-null in the request (partial update pattern), or require all fields via `@NotNull` validation.

---

### 3.5 Chat Module

**Files**: `ChatController`, `ChatService`, `ChatWebSocketHandler`, `ChatWebSocketConfig`, 3 repositories, 3 entities, 4 DTOs

**Responsibility**: Private/group chat, real-time WebSocket messaging.

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **Compilation error — typo in field name** | CRITICAL | `ChatWebSocketHandler.java:44` | `this.chatGroupMemberMemberRepository` — doubled "Member" — code won't compile |
| 2 | **Compilation error — undefined reference** | CRITICAL | `ChatWebSocketHandler.java:138` | `chat.handleLeaveGroup(session, json)` — `chat` is undefined variable |
| 3 | **Controller bypasses service layer** | HIGH | `ChatController.java:50-56` | `listPrivateChats` directly calls `chatGroupMemberRepository` and `chatGroupRepository` |
| 4 | **`.subscribe()` in WebSocket broadcast** | HIGH | `ChatWebSocketHandler.java:207-212` | `session.send(...).subscribe()` inside `forEach` — fire-and-forget, errors lost |
| 5 | **Metadata labeled as "token"** | MEDIUM | `ChatWebSocketHandler.java:199` | Broadcast payload uses key `"token"` for what should be `"metadata"` — confusing for clients |
| 6 | **No message edit/delete** | MEDIUM | `ChatMessage.java` | Entity has `edited_at`/`deleted_at` fields but no service methods implement edit or soft-delete |
| 7 | **In-memory session map** | MEDIUM | `ChatWebSocketHandler.java:38-39` | `groupToSessions` is a local `ConcurrentHashMap` — won't work with multiple server instances |
| 8 | **N+1 in listPrivateChats** | LOW | `ChatController.java:52-55` | Fetches all member groups, then calls `findById` for each group — N+1 |

#### Bug #1 & #2 — Code Won't Compile

```java
// ChatWebSocketHandler.java:44 — typo: doubled "Member"
this.chatGroupMemberMemberRepository = chatGroupMemberRepository;
// Should be: this.chatGroupMemberRepository = chatGroupMemberRepository;

// ChatWebSocketHandler.java:138 — undefined variable "chat"
case "LEAVE_GROUP" -> chat.handleLeaveGroup(session, json);
// Should be: case "LEAVE_GROUP" -> handleLeaveGroup(session, json);
```

These are compilation errors — the WebSocket handler is non-functional.

#### Bug #3 — Controller Bypasses Service

```java
// ChatController.java:50-56 — repository calls directly in controller
@GetMapping("/groups")
public Mono<ResponseEntity<ApiResponse<List<ChatGroup>>>> listPrivateChats(/*...*/) {
    return SecurityUtils.getCurrentUserId()
        .flatMap(memberId -> chatGroupMemberRepository.findByMemberId(memberId)
            .map(ChatGroupMember::getGroupId)
            .distinct()
            .flatMap(chatGroupRepository::findById)  // N+1 query!
            .filter(group -> type == null || type.equalsIgnoreCase(group.getType()))
            .collectList())
        // ...
}
```

This is also an N+1: one query per group. Move to service and use a single batch query:

```java
// ChatService.java — proper implementation
public Flux<ChatGroup> getUserChatGroups(Long memberId, String type) {
    return chatGroupMemberRepository.findGroupIdsByMemberId(memberId)
        .collectList()
        .flatMapMany(groupIds -> chatGroupRepository.findAllById(groupIds))
        .filter(group -> type == null || type.equalsIgnoreCase(group.getType()));
}
```

---

### 3.6 Admin Module

**Files**: 5 controllers (3 empty), 5 services (3 empty), 5 repositories (3 empty), 2 entities, 6 DTOs

**Responsibility**: User management, organization CRUD, forum/event admin.

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **SQL syntax error** | CRITICAL | `AdminUserRepository.java:70` | `SELECT SELECT * FROM users` — doubled SELECT keyword |
| 2 | **SQL typo** | CRITICAL | `AdminUserRepository.java:97` | `om_verifier ON pv.verifier_member_id = org_verifier.id` — alias is `org_verifier` but should be `om_verifier` |
| 3 | **Duplicate User repository** | HIGH | `AdminUserRepository.java` | Operates on `users` table — same as `AuthRepository` — violates module boundaries |
| 4 | **No admin authorization** | HIGH | All controllers | No `@PreAuthorize`, `@RequireRole`, or role checks — any user can access admin endpoints |
| 5 | **Entity used as request body** | MEDIUM | `AdminOrganizationController.java:69` | `@RequestBody Organization organization` — exposes entity directly to client |
| 6 | **8 empty classes** | LOW | Various | `AdminForumController`, `AdminEventController`, `AuditController`, `AdminForumService`, `AdminEventService`, `AuditService`, `AuditRepository`, `AdminForumRepository`, `AdminEventRepository` |
| 7 | **UserResponse.updatedAt mismatch** | MEDIUM | `UserResponse.java:21` + `AdminUserService.java:137` | `UserResponse.updatedAt` is `LocalDateTime` but `User.updatedAt` is `String` — runtime mapping failure |

#### Bug #1 — SQL Syntax Error

```java
// AdminUserRepository.java:70 — won't execute
@Query("SELECT SELECT * FROM users ORDER BY created_at DESC")
Flux<User> findAllUsers();
```

Double `SELECT` — this query will fail at runtime. It's currently unused (the paginated version is used instead), but it's a landmine.

#### Bug #2 — SQL Alias Typo

```java
// AdminUserRepository.java:97 — wrong alias
@Query("... INNER JOIN organization_members om_verifier ON pv.verifier_member_id = org_verifier.id ...")
//                                         ^^^^^^^^^^                                ^^^^^^^^^^^^
//                                         defined as om_verifier                    referenced as org_verifier
```

This query will fail with "column org_verifier.id does not exist".

#### Anti-Pattern — Entity as API Contract

```java
// AdminOrganizationController.java:69
@PostMapping
public Mono<ResponseEntity<ApiResponse<Organization>>> createOrganization(
        @Valid @RequestBody Organization organization) {  // Entity directly!
```

Exposing the entity means:
- Client can set `id` (auto-generated)
- Client can set `createdAt` (should be server-side)
- No validation annotations on entity fields
- Schema changes directly break the API contract

**Fix**: Create `CreateOrganizationRequest` and `OrganizationResponse` DTOs.

---

### 3.7 Mentorship Module

**Files**: `MentorController`, `MenteeController`, `MentorService`, `MenteeService`, 5 repositories, 5 entities, 14 DTOs

**Responsibility**: Mentor profiles, expertise, availability, sessions, feedback.

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **MOCK IDs with different values** | CRITICAL | Both services | `MentorService.MOCK_MEMBER_ID = 1`, `MenteeService.MOCK_MEMBER_ID = 2` — hardcoded different users |
| 2 | **Race condition on session booking** | HIGH | `MenteeService.bookSession` | Check availability status + update + create session is not atomic — concurrent bookings possible |
| 3 | **No availability overlap detection** | HIGH | `MentorService.addAvailability` | Mentor can create overlapping time slots (10:00-12:00 and 11:00-13:00) |
| 4 | **No status validation** | MEDIUM | `UpdateSessionStatusRequest.java` | `status` is `@NotBlank String` — accepts any string ("APPROVED", "asdf", "drop table") |
| 5 | **Shared 5 repositories** | MEDIUM | Both services | `MentorService` and `MenteeService` inject identical set of 5 repositories |
| 6 | **`Persistable` pattern is fragile** | MEDIUM | `MentorProfile.java:53-63` | Uses `isNew` transient flag — if entity is deserialized or loaded from cache, `isNew` defaults to `true` causing duplicate insert |
| 7 | **Duplicate `PaginatedResponse`** | LOW | `mentorship/dto/response/PaginatedResponse.java` | Third identical copy in codebase |

#### Bug #2 — Race Condition on Booking

```java
// MenteeService.bookSession — simplified flow:
availabilityRepository.findById(request.getAvailabilityId())   // 1. Read
    .flatMap(availability -> {
        if (!"Available".equals(availability.getStatus())) {    // 2. Check
            return Mono.error(/*...*/);
        }
        return availabilityRepository.updateStatus(/*...*/)     // 3. Update
            .then(sessionRepository.save(session));              // 4. Insert
    });
```

Two concurrent requests both read the availability as "Available" in step 1, both pass check in step 2, both update in step 3. Result: two sessions booked for one availability slot.

**Fix**: Use optimistic locking (add `@Version` column) or pessimistic locking (`SELECT ... FOR UPDATE`):

```sql
-- Atomic update that returns 0 rows if already booked:
UPDATE mentor_availabilities
SET status = 'Booked'
WHERE id = :id AND status = 'Available'
-- If affectedRows == 0, the slot was already taken
```

#### Bug #4 — Unvalidated Status Transitions

```java
// UpdateSessionStatusRequest.java
@NotBlank
private String status;  // ANY string accepted
```

There's no validation that `status` is one of the valid transitions (e.g., `PENDING` → `APPROVED` → `COMPLETED` or `PENDING` → `CANCELLED`). A client could set `status = "COMPLETED"` directly, skipping the approval flow.

**Fix**: Use an enum and validate allowed transitions:

```java
public enum SessionStatus {
    PENDING, APPROVED, CANCELLED, COMPLETED;

    private static final Map<SessionStatus, Set<SessionStatus>> VALID_TRANSITIONS = Map.of(
        PENDING, Set.of(APPROVED, CANCELLED),
        APPROVED, Set.of(COMPLETED, CANCELLED)
    );

    public boolean canTransitionTo(SessionStatus target) {
        return VALID_TRANSITIONS.getOrDefault(this, Set.of()).contains(target);
    }
}
```

---

### 3.8 Shared Module & Config

**Files**: `GlobalExceptionHandler`, `ApplicationException`, `ErrorCode`, `SecurityConfig`, `HeaderAuthenticationFilter`, `SecurityUtils`, `JwtUtils`, `CacheUtils`, `EmailService`, `TimeUtils`, `JsonUtils`, `RequireRole`, `PassEncoderConfig`, `AppConfig`, `R2dbcConfig`, `OpenApiConfig`, `EmailConfig`, 10 enums

#### Problems Found

| # | Problem | Severity | File:Line | Details |
|---|---------|----------|-----------|---------|
| 1 | **All exceptions return 500** | HIGH | `GlobalExceptionHandler.java:35-39` | `ApplicationException` falls through to generic `Exception` handler → HTTP 500 for "Event not found" |
| 2 | **Security disabled** | CRITICAL | `SecurityConfig.java:52` | `.anyExchange().permitAll()` — all endpoints publicly accessible |
| 3 | **Duplicate path matching** | HIGH | `HeaderAuthenticationFilter.java` vs `SecurityConfig.java` | Public paths defined in two places — easily go out of sync |
| 4 | **`@RequireRole` is dead code** | HIGH | `RequireRole.java` | Annotation exists but no AOP aspect processes it — annotated methods have no enforcement |
| 5 | **`@RequireRole` imports `@PreAuthorize` but doesn't use it** | LOW | `RequireRole.java:8` | Misleading import suggests it should be a meta-annotation but it's not wired |
| 6 | **Type mismatch in SecurityUtils** | MEDIUM | `SecurityUtils.java:21` | Returns `Mono<Long>` but JWT stores `userId` as `Integer` — works via string parsing but fragile |
| 7 | **ErrorCode has typo** | LOW | `ErrorCode.java:27` | Comment says "Mentorship modulee" (double e) |
| 8 | **ErrorCode lacks HTTP status metadata** | MEDIUM | `ErrorCode.java` | Just an enum with no associated HTTP status — mapping is done ad-hoc elsewhere |

#### Critical — All Business Exceptions Return 500

```java
// GlobalExceptionHandler.java:35-39
@ExceptionHandler(Exception.class)
public Mono<ResponseEntity<?>> handleGenericException(Exception ex) {
    return Mono.just(ResponseEntity.status(500)
        .body(new ApiResponse<>("Internal server error", ex.getMessage())));
}
```

`ApplicationException extends RuntimeException extends Exception` — the generic handler catches it. "Event not found" returns `500 Internal Server Error` with the raw exception message exposed to the client.

**Fix**: Add a dedicated handler for `ApplicationException` that maps `ErrorCode` to proper HTTP status codes. See Section 9 of this report for the complete implementation.

---

## 4. Spring Security Redesign

### Current State: Security is DISABLED

```java
// SecurityConfig.java — line 52
.anyExchange().permitAll()); // Temporary: allow all requests for development
```

And `HeaderAuthenticationFilter` **duplicates** all the path-matching logic from `SecurityConfig`. These two are completely out of sync.

### Key Security Anti-Patterns Found

| Anti-Pattern | Location | Fix |
|-------------|----------|-----|
| Security disabled in config | `SecurityConfig.java:52` | Use `.anyExchange().authenticated()` |
| Duplicate path matching | `HeaderAuthenticationFilter` mirrors `SecurityConfig` | Define public paths once, reference from both |
| Generic `RuntimeException` for auth errors | `JwtUtils.validateToken()` | Use typed exceptions (`TokenExpiredException`, `InvalidTokenException`) |
| `spring.security.user.name/password` in properties | `application.properties:54-55` | Remove — not using form login |
| No refresh token revocation | `AuthService.refreshAccessToken()` | Store refresh tokens in DB; check against revocation list |
| JWT secret too short/hardcoded | `application.properties:24` | Use env variable; minimum 256-bit key |

### Proposed SecurityConfig

```java
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity  // Enable @PreAuthorize on methods
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    private static final String[] PUBLIC_PATHS = {
        "/api/auth/**",
        "/api/guest/**",
        "/swagger-ui/**",
        "/swagger-ui.html",
        "/v3/api-docs/**",
        "/webjars/**",
        "/ws/**"
    };

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            .authorizeExchange(auth -> auth
                .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .pathMatchers(PUBLIC_PATHS).permitAll()
                .pathMatchers("/api/admin/**").hasRole("admin")
                .anyExchange().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(unauthorizedEntryPoint())
                .accessDeniedHandler(accessDeniedHandler())
            )
            .build();
    }

    @Bean
    public ServerAuthenticationEntryPoint unauthorizedEntryPoint() {
        return (exchange, ex) -> {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            String body = """
                {"message":"Authentication required","error":"UNAUTHORIZED"}
                """;
            DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes());
            return exchange.getResponse().writeWith(Mono.just(buffer));
        };
    }

    @Bean
    public ServerAccessDeniedHandler accessDeniedHandler() {
        return (exchange, denied) -> {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            String body = """
                {"message":"Access denied","error":"FORBIDDEN"}
                """;
            DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes());
            return exchange.getResponse().writeWith(Mono.just(buffer));
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:5173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### Redesigned JWT Filter

The current filter has problems: manually writes error responses (duplicating GlobalExceptionHandler), logs at ERROR level for normal auth failures, and doesn't differentiate token types.

```java
@Component
public class JwtAuthenticationFilter implements WebFilter {

    private final JwtProvider jwtProvider;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final Set<String> PUBLIC_PATTERNS = Set.of(
        "/api/auth/**", "/api/guest/**", "/swagger-ui/**",
        "/v3/api-docs/**", "/webjars/**", "/ws/**"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        String token = extractToken(exchange.getRequest());
        if (token == null) {
            // Let Spring Security handle 401 via entryPoint
            return chain.filter(exchange);
        }

        try {
            JwtClaims claims = jwtProvider.validateAndParse(token);
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    claims.userId(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + claims.role()))
                );
            return chain.filter(exchange)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
        } catch (TokenExpiredException e) {
            return writeErrorResponse(exchange, HttpStatus.UNAUTHORIZED,
                "TOKEN_EXPIRED", "Token has expired");
        } catch (InvalidTokenException e) {
            return writeErrorResponse(exchange, HttpStatus.UNAUTHORIZED,
                "INVALID_TOKEN", "Invalid token");
        }
    }

    private String extractToken(ServerHttpRequest request) {
        String header = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATTERNS.stream()
            .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private Mono<Void> writeErrorResponse(
            ServerWebExchange exchange, HttpStatus status,
            String errorCode, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format(
            "{\"message\":\"%s\",\"error\":\"%s\"}", message, errorCode);
        DataBuffer buffer = exchange.getResponse().bufferFactory()
            .wrap(body.getBytes());
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
```

---

## 5. RBAC Design

### Current State

- `UserRole` enum: 5 roles (`admin`, `student`, `alumni`, `staff`, `guest`)
- `@RequireRole` annotation exists but **does nothing** — no AOP aspect processing it
- No `@PreAuthorize` or `@EnableReactiveMethodSecurity` enabled

### Proposed Role-Permission Model

For this scale, a **Role-based model with optional permissions** is the right call. Don't over-engineer with a full permission table unless per-resource ACL is needed.

**Database schema addition**:

```sql
CREATE TABLE "role_permissions" (
    "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "role" varchar NOT NULL,            -- 'admin', 'staff', etc.
    "permission" varchar NOT NULL,      -- 'event:create', 'forum:moderate', etc.
    UNIQUE("role", "permission")
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
```

### Implementation — Make `@RequireRole` Work

**Annotation** (already exists):

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    String[] value();
}
```

**AOP Aspect** (NEW — currently missing):

```java
@Aspect
@Component
public class RequireRoleAspect {

    @Around("@annotation(requireRole)")
    public Object checkRole(ProceedingJoinPoint joinPoint, RequireRole requireRole)
            throws Throwable {
        Object result = joinPoint.proceed();

        if (result instanceof Mono<?> mono) {
            return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    String userRole = auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(a -> a.startsWith("ROLE_"))
                        .map(a -> a.substring(5))
                        .findFirst()
                        .orElse("");

                    boolean hasRole = Arrays.stream(requireRole.value())
                        .anyMatch(r -> r.equalsIgnoreCase(userRole));

                    if (!hasRole) {
                        return Mono.error(new ApplicationException(
                            ErrorCode.FORBIDDEN,
                            "Required role: " + Arrays.toString(requireRole.value())
                        ));
                    }
                    return (Mono<?>) result;
                });
        }
        return result;
    }
}
```

### Usage — Method-Level vs URL-Level

Use **both** complementarily:

```java
// URL-level: broad strokes in SecurityConfig
.pathMatchers("/api/admin/**").hasRole("admin")
.pathMatchers("/api/mentorship/mentor/profile/**").hasAnyRole("alumni", "staff")

// Method-level: fine-grained in controllers
@RequireRole({"admin", "staff"})
@PostMapping("/events")
public Mono<ApiResponse<Event>> createEvent(
        @Valid @RequestBody CreateEventRequest request) {
    return SecurityUtils.getCurrentUserId()
        .flatMap(userId -> eventService.createEvent(request, userId));
}

// Or use Spring's built-in @PreAuthorize (after @EnableReactiveMethodSecurity)
@PreAuthorize("hasAnyRole('admin', 'staff')")
@DeleteMapping("/events/{id}")
public Mono<ApiResponse<Void>> deleteEvent(@PathVariable Long id) { ... }
```

**Recommendation**: Prefer `@PreAuthorize` for new code since it's natively supported by Spring Security. Keep `@RequireRole` only if custom logic beyond role checking is needed (e.g., checking organization membership).

---

## 6. Logging Strategy

### Current State: Barely Functional

| Problem | Details |
|---------|---------|
| Config conflict | `logback-spring.xml` has console-only appender; `application.properties` configures file output that's ignored |
| No correlation ID | Impossible to trace a request across log lines |
| PII in logs | Emails logged at INFO level in AuthService |
| Excessive INFO | Every successful CRUD operation logged at INFO |
| No structured format | Text-only logs are unparseable by ELK/Loki |

### Proposed `logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProperty scope="context" name="appName"
                    source="spring.application.name" defaultValue="alumniverse"/>

    <!-- Structured JSON for production -->
    <springProfile name="prod,staging">
        <appender name="JSON_FILE"
                  class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/application.log</file>
            <rollingPolicy
                class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                <fileNamePattern>
                    logs/application.%d{yyyy-MM-dd}.%i.log.gz
                </fileNamePattern>
                <maxFileSize>50MB</maxFileSize>
                <maxHistory>30</maxHistory>
                <totalSizeCap>1GB</totalSizeCap>
            </rollingPolicy>
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <customFields>{"service":"${appName}"}</customFields>
            </encoder>
        </appender>

        <appender name="CONSOLE"
                  class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
        </appender>

        <root level="INFO">
            <appender-ref ref="JSON_FILE"/>
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <!-- Human-readable for development -->
    <springProfile name="dev,default">
        <appender name="CONSOLE"
                  class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>
                    %highlight(%level) %cyan(%d{HH:mm:ss}) [%X{correlationId:-none}] %yellow(%thread) %magenta(%logger{0}) %msg%n
                </pattern>
            </encoder>
        </appender>

        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>

        <logger name="com.service.backend" level="DEBUG"/>
        <logger name="org.springframework.r2dbc" level="DEBUG"/>
    </springProfile>
</configuration>
```

**Required dependency for structured logging**:

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>
```

### Correlation ID Filter

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter implements WebFilter {

    private static final String CORRELATION_HEADER = "X-Correlation-ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String correlationId = exchange.getRequest().getHeaders()
            .getFirst(CORRELATION_HEADER);
        if (correlationId == null) {
            correlationId = UUID.randomUUID().toString().substring(0, 8);
        }

        exchange.getResponse().getHeaders()
            .add(CORRELATION_HEADER, correlationId);

        String finalCorrelationId = correlationId;
        return chain.filter(exchange)
            .contextWrite(ctx -> ctx.put("correlationId", finalCorrelationId))
            .doOnEach(signal -> {
                if (!signal.isOnComplete()) {
                    MDC.put("correlationId", finalCorrelationId);
                }
            });
    }
}
```

### Log Level Guidelines

| Level | Use For | Example |
|-------|---------|---------|
| **ERROR** | Unrecoverable failures, data corruption risk | DB connection failure, payment processing error |
| **WARN** | Recoverable issues, degraded behavior | Rate limit hit, cache miss fallback, invalid token |
| **INFO** | Business events (login, registration, payment) | User registered, event published, ticket checked in |
| **DEBUG** | Technical details for troubleshooting | SQL query params, cache hit/miss, request/response bodies |

**Current problem — excessive INFO logging**:

```java
// BAD: current state — logs every routine operation at INFO
log.info("Finding all forum categories for organization ID: {}", organizationId);
log.info("Successfully retrieved forum categories for organization ID: {}", organizationId);

// GOOD: only log business-meaningful events at INFO
log.debug("Fetching categories for org={}", organizationId);
// No success log needed — absence of error IS success
```

---

## 7. Reactive Programming Evaluation

### Should You Use WebFlux? — Yes, but with caveats

The project is already committed to WebFlux + R2DBC. This is the **right choice** because:

1. **Chat with WebSocket** is natively reactive
2. **High-concurrency read workloads** (event listings, forum browsing) benefit from non-blocking I/O
3. **R2DBC** eliminates the thread-per-connection bottleneck of JDBC

### When WebFlux is Correct (this case)

- API gateway pattern with many downstream calls
- WebSocket-heavy features (chat)
- High read-to-write ratio (forum, articles)
- Connection-limited databases (R2DBC pool of 20 handles more than 20 concurrent requests)

### When NOT to Use Reactive (watch out)

**CPU-intensive operations** — password hashing with BCrypt blocks the event loop:

```java
// BAD: blocks event loop
String hashedPassword = passwordEncoder.encode(password);

// GOOD: offload blocking work
Mono.fromCallable(() -> passwordEncoder.encode(password))
    .subscribeOn(Schedulers.boundedElastic())
```

**Email sending** — `JavaMailSender` is blocking:

```java
// EmailService likely blocks — wrap it
public Mono<Void> sendHtmlEmail(String to, String subject,
        String template, Map<String, Object> vars) {
    return Mono.fromRunnable(() -> {
        // blocking mail send
        mailSender.send(message);
    }).subscribeOn(Schedulers.boundedElastic()).then();
}
```

### Critical Reactive Anti-Pattern in Current Code

**Never call `.subscribe()` in a service method** (ForumService.java:223-228). This creates an orphaned subscription that:
- Is not part of the request lifecycle
- Cannot be cancelled if the client disconnects
- Bypasses back-pressure
- Silently fails

See [Section 3.3 Forum Module](#33-forum-module) for the fix.

### WebFlux vs Spring MVC Comparison

| Aspect | WebFlux (current) | Spring MVC |
|--------|-------------------|------------|
| **Threading** | Event loop (few threads) | Thread-per-request |
| **DB Access** | R2DBC (non-blocking) | JDBC/JPA (blocking) |
| **Complexity** | Higher (reactive chains) | Lower (imperative) |
| **WebSocket** | Native support | Requires additional config |
| **Debugging** | Harder (async stack traces) | Easier |
| **Throughput** | Higher under load | Lower under load |
| **Ecosystem** | Smaller (no JPA, no Hibernate) | Larger |

**Verdict**: Stay with WebFlux. The investment is already made and the use case (chat + high-read APIs) justifies it. Focus on learning the patterns correctly rather than migrating back.

---

## 8. Database Optimization

### 8.1 Missing Indexes — Critical Performance Gap

The schema only has unique indexes. **Every FK index** and **every query filter index** is missing:

```sql
-- Event queries
CREATE INDEX idx_events_org_id ON events(organization_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_org_published ON events(organization_id, is_published);
CREATE INDEX idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX idx_event_tickets_member_id ON event_tickets(member_id);
CREATE INDEX idx_event_tickets_code ON event_tickets(ticket_code);

-- Forum queries
CREATE INDEX idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX idx_forum_topics_org ON forum_topics(organization_id);
CREATE INDEX idx_forum_posts_topic ON forum_posts(topic_id);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_member_id);
CREATE INDEX idx_forum_categories_org ON forum_categories(organization_id);

-- Article queries
CREATE INDEX idx_news_org ON news(organization_id);
CREATE INDEX idx_jobs_org ON jobs(organization_id);
CREATE INDEX idx_jobs_active ON jobs(is_active, deadline);
CREATE INDEX idx_saved_items_member ON saved_items(member_id);

-- Chat queries
CREATE INDEX idx_chat_members_group ON chat_group_members(group_id);
CREATE INDEX idx_chat_members_member ON chat_group_members(member_id);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id, created_at);

-- Mentorship queries
CREATE INDEX idx_mentor_expertise_mentor ON mentor_expertise(mentor_member_id);
CREATE INDEX idx_mentor_avail_mentor ON mentor_availabilities(mentor_member_id);
CREATE INDEX idx_mentorship_sessions_avail ON mentorship_sessions(availability_id);
CREATE INDEX idx_mentorship_sessions_mentee ON mentorship_sessions(mentee_member_id);

-- Auth queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(user_name);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
```

### 8.2 Adopt Flyway for Schema Management

Schema is currently managed via raw SQL files loaded through Docker. This doesn't work when:
- A table needs alteration in production
- Multiple developers create conflicting schema changes
- Rollback capability is needed

**Add to `pom.xml`**:

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

**Migration file structure**:

```
backend/src/main/resources/db/migration/
├── V1__initial_schema.sql          # Current postgre.sql content
├── V2__add_indexes.sql             # All missing indexes above
├── V3__add_role_permissions.sql    # RBAC tables
```

### 8.3 N+1 Prevention

`ForumService.findPostsByTopicId` already handles this correctly with batch-fetching liked posts — good pattern. However, check other modules:

**Potential N+1 in MentorService** — when listing mentors with their expertise:

```java
// BAD: N+1 — 1 query per mentor
mentorProfiles.flatMap(mentor ->
    expertiseRepo.findByMentorId(mentor.getMemberId())
)

// GOOD: batch fetch
mentorProfiles.collectList()
    .flatMap(mentors -> {
        List<Long> mentorIds = mentors.stream()
            .map(MentorProfile::getMemberId).toList();
        return expertiseRepo.findByMentorMemberIdIn(mentorIds)
            .collectMultimap(MentorExpertise::getMentorMemberId)
            .map(expertiseMap -> /* join in memory */);
    })
```

### 8.4 Pagination Strategy

Current offset-based pagination is correct for small datasets. For high-offset performance (page 10000+), consider **keyset/cursor pagination**:

```java
// Offset pagination — degrades at high page numbers
@Query("SELECT * FROM events WHERE organization_id = :orgId "
     + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")

// Keyset pagination — constant performance regardless of page number
@Query("SELECT * FROM events WHERE organization_id = :orgId "
     + "AND created_at < :cursor ORDER BY created_at DESC LIMIT :limit")
```

### 8.5 Caching Strategy

Caffeine (in-memory) is fine for single instance. When multi-instance support is needed:

| Data | Cache Strategy | TTL |
|------|---------------|-----|
| User profile/role (from JWT) | Local Caffeine | 5 min |
| Forum categories | Local Caffeine | 15 min |
| Event listings | Local Caffeine | 2 min |
| OTP codes | Redis (shared) | 5 min |
| Rate limiting | Redis (shared) | Per-window |
| Chat presence | Redis Pub/Sub | Real-time |

### 8.6 Transaction Boundaries

No explicit `@Transactional` usage found. Critical operations that need transactions:

```java
// Event ticket registration — check capacity + register must be atomic
@Transactional
public Mono<EventTicket> registerForEvent(Long eventId, RegisterTicketRequest request) {
    return eventRepository.countRegisteredTickets(eventId)
        .flatMap(count -> {
            if (count >= event.getMaxCapacity()) {
                return Mono.error(new ApplicationException(
                    ErrorCode.EVENT_FULLY_BOOKED, "Event is fully booked"));
            }
            return eventRepository.registerTicket(ticket);
        });
}
```

---

## 9. Exception Handling Redesign

### Current Problem

`GlobalExceptionHandler` returns HTTP 500 for ALL exceptions including `ApplicationException`:

```java
// Current: "Event not found" returns 500 Internal Server Error
@ExceptionHandler(Exception.class)
public Mono<ResponseEntity<?>> handleGenericException(Exception ex) {
    return Mono.just(ResponseEntity.status(500)
        .body(new ApiResponse<>("Internal server error", ex.getMessage())));
}
```

### Proposed Fix

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
        LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final Map<ErrorCode, HttpStatus> ERROR_STATUS_MAP =
        Map.ofEntries(
            // 404 Not Found
            Map.entry(ErrorCode.USER_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.EVENT_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.TICKET_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.RESOURCES_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.NEWS_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.JOB_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.MENTOR_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.EXPERTISE_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.AVAILABILITY_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.SESSION_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.ACHIEVEMENT_NOT_FOUND, HttpStatus.NOT_FOUND),
            Map.entry(ErrorCode.SAVED_ITEM_NOT_FOUND, HttpStatus.NOT_FOUND),

            // 409 Conflict
            Map.entry(ErrorCode.RESOURCES_DUPLICATE, HttpStatus.CONFLICT),
            Map.entry(ErrorCode.ITEM_ALREADY_SAVED, HttpStatus.CONFLICT),
            Map.entry(ErrorCode.ALREADY_INTERESTED, HttpStatus.CONFLICT),
            Map.entry(ErrorCode.MENTOR_PROFILE_ALREADY_EXISTS, HttpStatus.CONFLICT),
            Map.entry(ErrorCode.FEEDBACK_ALREADY_EXISTS, HttpStatus.CONFLICT),

            // 401 Unauthorized
            Map.entry(ErrorCode.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED),

            // 403 Forbidden
            Map.entry(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN),

            // 422 Unprocessable Entity
            Map.entry(ErrorCode.EVENT_FULLY_BOOKED, HttpStatus.UNPROCESSABLE_ENTITY),
            Map.entry(ErrorCode.AVAILABILITY_NOT_AVAILABLE,
                HttpStatus.UNPROCESSABLE_ENTITY),
            Map.entry(ErrorCode.TICKET_ALREADY_CANCELLED,
                HttpStatus.UNPROCESSABLE_ENTITY),
            Map.entry(ErrorCode.TICKET_ALREADY_CHECKED_IN,
                HttpStatus.UNPROCESSABLE_ENTITY),
            Map.entry(ErrorCode.SESSION_ALREADY_CANCELLED,
                HttpStatus.UNPROCESSABLE_ENTITY),
            Map.entry(ErrorCode.SESSION_NOT_COMPLETED,
                HttpStatus.UNPROCESSABLE_ENTITY)
        );

    @ExceptionHandler(ApplicationException.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleApplicationException(
            ApplicationException ex) {
        HttpStatus status = ERROR_STATUS_MAP.getOrDefault(
            ex.getErrorCode(), HttpStatus.BAD_REQUEST);
        return Mono.just(ResponseEntity.status(status)
            .body(new ApiResponse<>(ex.getMessage(), null)));
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<ApiResponse<Map<String, String>>>> handleValidation(
            WebExchangeBindException ex) {
        Map<String, String> errors = ex.getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage,
                (a, b) -> a));
        return Mono.just(ResponseEntity.badRequest()
            .body(new ApiResponse<>("Validation failed", errors)));
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        // NEVER expose ex.getMessage() in production — may contain SQL or stack traces
        return Mono.just(ResponseEntity.status(500)
            .body(new ApiResponse<>("Internal server error", null)));
    }
}
```

### Migrate RuntimeException to ApplicationException

All `RuntimeException` usage in auth and forum modules should be replaced:

```java
// BAD: current state
return Mono.error(new RuntimeException(AuthConstants.ERROR_EMAIL_ALREADY_REGISTERED));

// GOOD: typed exception with proper error code
return Mono.error(new ApplicationException(
    ErrorCode.RESOURCES_DUPLICATE, "Email already registered"));
```

---

## 10. Configuration Management

### Current Problem: Secrets in Source Control

```properties
# application.properties — ALL of these are exposed
spring.r2dbc.password=123
spring.mail.password=bvvqflluvxwzxckc
jwt.secret=your_secret_key_change_this_in_production_environment_with_minimum_256_bits
spring.security.user.password=admin@123456
```

### Fix: Profile-Based Configuration

**`application.properties`** — shared/safe defaults only:

```properties
server.port=8080
spring.application.name=alumniverse-backend

springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html

spring.r2dbc.pool.initial-size=5
spring.r2dbc.pool.max-size=20
spring.r2dbc.pool.max-idle-time=30m
```

**`application-dev.properties`** — local development (gitignored or with dummy values):

```properties
spring.r2dbc.url=r2dbc:postgresql://localhost:5432/db
spring.r2dbc.username=user
spring.r2dbc.password=123
jwt.secret=${JWT_SECRET:dev-secret-key-minimum-256-bits-long-enough-for-hmac-sha256}
spring.mail.password=${MAIL_PASSWORD:dev-password}
```

**`application-prod.properties`** — environment variables only:

```properties
spring.r2dbc.url=${DATABASE_URL}
spring.r2dbc.username=${DATABASE_USERNAME}
spring.r2dbc.password=${DATABASE_PASSWORD}
jwt.secret=${JWT_SECRET}
spring.mail.password=${MAIL_PASSWORD}
```

---

## 11. Scaling Considerations (Millions of Users)

### Phase 1: Optimize Current Monolith (10K-100K users)

- Add all missing indexes (immediate ~10x improvement on queries)
- Enable connection pool metrics via Micrometer
- Add Redis for shared caching and rate limiting
- Add CDN for static assets (avatars, banners)

### Phase 2: Horizontal Scaling (100K-1M users)

- Run multiple backend instances behind a load balancer
- Move to Redis for session/OTP/rate-limit state (Caffeine is not shared across instances)
- Extract chat into a dedicated WebSocket server
- Add read replicas for PostgreSQL

### Phase 3: Service Decomposition (1M+ users)

- Extract hot paths: `chat` → standalone service, `event-ticketing` → standalone service
- Event-driven communication between services (Kafka/RabbitMQ)
- CQRS for forum/event reads (denormalized read models)
- Database per service

### Hidden Risks Identified

| Risk | Description | Mitigation |
|------|-------------|------------|
| **OTP in-memory** | Server restart loses all pending OTPs | Migrate to Redis |
| **No rate limiting on auth** | Brute force attacks on login/OTP | Bucket4j is in `pom.xml` but not wired to auth endpoints |
| **No input sanitization** | Forum post content could contain XSS | Sanitize HTML on write, escape on read |
| **No audit trail** | No record of who changed what | Add audit events (at least for admin actions) |
| **WebSocket no auth** | Chat WebSocket parses JWT manually | Integrate with Spring Security WebSocket support |
| **No graceful shutdown** | Active WebSocket connections dropped | Configure `server.shutdown=graceful` |
| **No health checks** | No `/actuator/health` endpoint | Add Spring Boot Actuator |

---

## 12. CI/CD & Testing Strategy

### CI/CD Pipeline

```yaml
# .github/workflows/backend.yml
name: Backend CI
on:
  push:
    paths: ['backend/**']
  pull_request:
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: ./mvnw verify -Dspring.profiles.active=test
        working-directory: backend

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./mvnw package -DskipTests
        working-directory: backend
      - uses: docker/build-push-action@v5
        with:
          context: backend
          push: ${{ github.ref == 'refs/heads/main' }}
          tags: ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
```

### Testing Strategy

| Layer | Tool | What to Test |
|-------|------|-------------|
| **Unit** | JUnit 5 + Mockito + StepVerifier | Service logic, JWT utils, validation |
| **Integration** | @SpringBootTest + Testcontainers | Repository queries, security filter chain |
| **Contract** | Spring Cloud Contract or Pact | API contract with frontend |
| **Load** | k6 or Gatling | Concurrent ticket registration, chat throughput |

### Priority Test Targets

1. `AuthService` — token generation, validation, refresh flow
2. `HeaderAuthenticationFilter` — public/private path routing
3. `EventService` — ticket registration race conditions
4. `ForumService` — pagination edge cases

---

## 13. Priority Action Items

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Enable `.anyExchange().authenticated()` in SecurityConfig | 5 min | Security |
| **P0** | Replace MOCK IDs with `SecurityUtils.getCurrentUserId()` | 2 hours | Security |
| **P0** | Move secrets to environment variables | 30 min | Security |
| **P1** | Add missing database indexes | 1 hour | Performance |
| **P1** | Fix `GlobalExceptionHandler` to map `ApplicationException` to proper HTTP status | 1 hour | Correctness |
| **P1** | Replace `RuntimeException` with `ApplicationException` in auth/forum | 2 hours | Correctness |
| **P1** | Implement `RequireRoleAspect` or switch to `@PreAuthorize` | 2 hours | Security |
| **P2** | Add Flyway for schema migrations | 2 hours | Maintainability |
| **P2** | Add correlation ID filter | 1 hour | Observability |
| **P2** | Split ForumService into 3 services | 3 hours | Maintainability |
| **P2** | Standardize module structure across all modules | 4 hours | Consistency |
| **P3** | Add structured JSON logging for production | 1 hour | Observability |
| **P3** | Add Spring Boot Actuator + health checks | 30 min | Operations |
| **P3** | Write integration tests for auth + security | 4 hours | Quality |
| **P3** | Consolidate duplicated `PaginatedResponse` | 1 hour | Maintainability |

---

> **Start with P0 immediately — the application currently has no authentication enforcement.**
