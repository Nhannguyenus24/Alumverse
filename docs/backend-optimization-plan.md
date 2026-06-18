# Backend Optimization Plan — Alumniverse (HCMUS)

**Stack**: Spring Boot 3.5.9 (WebFlux / R2DBC) · PostgreSQL on Supabase · Render.com · Gemini AI  
**Date**: 2026-06-18

---

## Part 1 — Performance & Cost Optimizations

### PRIORITY 1 — High Impact, Low Effort

#### OPT-1: Add `pg_trgm` Indexes for ILIKE Search
**Problem**: 20+ queries use `LOWER(col) LIKE LOWER('%keyword%')` — full sequential scans on every search.  
**Affected files**:
- `forum/dao/ForumTopicRepository.java` — 6 LIKE queries on `title`
- `forum/dao/ForumPostRepository.java` — 4 LIKE queries on `content`
- `admin/dao/AdminUserRepository.java` — 6 ILIKE queries across `email`, `student_id`, `full_name`
- `event/dao/EventTicketR2dbcRepository.java` — 8+ LIKE conditions

**Fix**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_email_trgm         ON users          USING GIN (email gin_trgm_ops);
CREATE INDEX idx_global_profiles_name_trgm ON global_profiles USING GIN (full_name gin_trgm_ops);
CREATE INDEX idx_forum_topics_title_trgm   ON forum_topics   USING GIN (title gin_trgm_ops);
CREATE INDEX idx_forum_posts_content_trgm  ON forum_posts    USING GIN (content gin_trgm_ops);
```
Also add B-tree indexes on common filter columns: `users.status`, `users.role`,
`organization_members.organization_id`, `notifications.member_id`, `verification_requests.status`.

**Effort**: Low | **Risk**: Very Low | **Cost Saving**: High (reduces Supabase DB CPU)

---

#### OPT-2: Fix BCrypt Blocking the Event Loop
**Problem**: `passwordEncoder.encode()` (~100ms CPU) is called synchronously on the Netty I/O thread.
`AuthService.java:91` does it correctly; `AdminUserService` and `UserService` do not.

**Affected**:
- `admin/service/AdminUserService.java` lines 132, 155, 416, 455
- `user/service/UserService.java` line 194

**Fix**:
```java
// Wrong (blocks I/O thread)
String encoded = passwordEncoder.encode(password);

// Correct
Mono<String> encoded = Mono.fromCallable(() -> passwordEncoder.encode(password))
    .subscribeOn(Schedulers.boundedElastic());
```
**Effort**: Low | **Risk**: Very Low | **Cost Saving**: Medium

---

#### OPT-3: Paginate Unbounded Notifications Query
**Problem**: `NotificationRepository.findByMemberIdOrderByCreatedAtDesc()` has no LIMIT — loads
entire notification history per request.  
**File**: `user/dao/NotificationRepository.java` line 17

**Fix**: Add `LIMIT :limit OFFSET :offset`, update `NotificationService.getMyNotifications()`
to accept `page` / `size` parameters (default first 20–50).

**Effort**: Low | **Risk**: Very Low | **Cost Saving**: Medium

---

#### OPT-4: Remove 163 Full-Object Log Serializations
**Problem**: Every service method calls `JsonUtils.toJson(result)` in `doOnSuccess` callbacks —
each DB response is JSON-serialized twice (once for HTTP response, once for log).

**Fix**: Change `log.info("... result: {}", JsonUtils.toJson(dto))` → `log.debug("...", dto)`.
`DEBUG` is suppressed in production by `application-prod.properties`.

**Effort**: Low (find-replace) | **Risk**: Very Low | **Cost Saving**: Medium (scales with traffic)

---

#### OPT-5: Fix R2DBC Pool Config for Supabase
**Problem**: `max-size=30` but Supabase free tier allows only 20 direct connections.
Using transaction-mode pooler URL with R2DBC can break prepared statements.  
**File**: `src/main/resources/application.properties` lines 15–26

**Fix**:
```properties
spring.r2dbc.pool.max-size=15
spring.r2dbc.pool.max-idle-time=10m
spring.r2dbc.pool.max-life-time=30m
# Use session-mode pooler URL, not transaction-mode
```
**Effort**: Low (config) | **Risk**: Medium (test in staging) | **Cost Saving**: High (prevents connection exhaustion)

---

### PRIORITY 2 — High Impact, Medium Effort

#### OPT-6: Move Images from Local Disk → CDN Object Storage
**Problem**: Images stored on Render local filesystem — **wiped on every redeploy**.
No CDN. `getImagesDirectorySize()` walks the filesystem on every Prometheus scrape.  
**File**: `shared/service/ImageService.java`

**Fix**: Migrate to Cloudflare R2 (zero egress cost) or Supabase Storage.
Remove `getImagesDirectorySize()` gauge. Update `image.domain` config to CDN URL.

**Effort**: Medium | **Risk**: Medium | **Cost Saving**: High (eliminates ~$7/mo Render persistent disk)

---

#### OPT-7: Replace Base64 Uploads with Multipart
**Problem**: All uploads encoded as Base64 JSON — 33% size inflation, 20MB codec buffer,
JVM heap pressure on every upload.  
**Affected**: `shared/controller/ImageController.java`, `shared/controller/FileUploadController.java`,
all services with `base64String` fields (EventService, FundService, UserService, etc.)

**Fix**: Switch to `multipart/form-data`. Long-term: pre-signed upload URLs so the backend
never touches the binary.

**Effort**: Medium | **Risk**: Medium (frontend change required) | **Cost Saving**: High

---

#### OPT-8: Gate & Batch Gemini API Calls
**Problem**: Gemini called inline on every forum post creation (moderation) + nightly batch
tagging with no cap. Direct dollar cost.  
**Affected**: `shared/cronjob/ForumPostTagScheduler.java`, `shared/service/AITagService.java`

**Fix**: Add `gemini.tagging.enabled=true/false` feature flag + max batch size limit (100 posts/run).

**Effort**: Low–Medium | **Risk**: Low | **Cost Saving**: High (direct API spend control)

---

#### OPT-9: Redis for OTP / Auth Cache (Upstash Free Tier)
**Problem**: OTPs stored in Caffeine in-memory cache. If Render spins up a second instance,
OTPs from instance A are invisible to instance B → intermittent "OTP expired" errors.  
**File**: `shared/utils/CacheUtils.java`

**Fix**: Replace auth-critical cache with Upstash Redis (serverless, free tier 10k commands/day)
via `ReactiveRedisTemplate`.

**Effort**: Medium | **Risk**: Medium | **Cost Saving**: Medium + correctness

---

#### OPT-10: Dashboard Cache TTL + Single-Query Refresh
**Problem**: `AdminDashboardService.getMetrics()` fires 8 parallel DB queries on every 5-minute
cache miss. On Render free tier (sleeps after 15 min inactivity) cache is always cold on wake-up.  
**File**: `admin/service/AdminDashboardService.java` lines 41–78

**Fix**: Increase TTL to 15 min, consolidate into 1 SQL view, add background periodic refresh.

**Effort**: Medium | **Risk**: Low | **Cost Saving**: Low–Medium

---

### PRIORITY 3 — Low Effort Quick Wins

| # | Fix | Effort | Risk |
|---|-----|--------|------|
| OPT-11 | Mentorship cron: every 5 min → 15 min (saves 576 DB queries/day) | Very Low | Low |
| OPT-12 | Disable Swagger UI in `application-prod.properties` | Very Low | Very Low |
| OPT-13 | Pre-compile CORS regex patterns at bean init (currently recompiles per request in `SecurityConfig.java:168`) | Very Low | Very Low |
| OPT-14 | R2DBC `validationDepth=LOCAL` + `max-life-time` to prevent Supabase force-closes | Very Low | Low |

---

### Summary Table

| # | Optimization | Effort | Impact | Risk | Cost Saving |
|---|---|---|---|---|---|
| OPT-1 | pg_trgm indexes for ILIKE | Low | High | Very Low | High |
| OPT-2 | BCrypt off event loop | Low | Medium | Very Low | Medium |
| OPT-3 | Paginate notifications | Low | Medium | Very Low | Medium |
| OPT-4 | Remove 163 log serializations | Low | Medium | Very Low | Medium |
| OPT-5 | Fix R2DBC pool config | Low | High | Medium | High |
| OPT-6 | Images → CDN storage | Medium | High | Medium | High |
| OPT-7 | Base64 → multipart uploads | Medium | High | Medium | High |
| OPT-8 | Gate Gemini API calls | Low–Med | Medium | Low | High |
| OPT-9 | Redis for OTP cache | Medium | High | Medium | Medium |
| OPT-10 | Dashboard cache + single query | Medium | Medium | Low | Low–Med |
| OPT-11 | Mentorship cron 15 min | Very Low | Low–Med | Low | Low |
| OPT-12 | Disable Swagger in prod | Very Low | Low | Very Low | Negligible |
| OPT-13 | Pre-compile CORS regex | Very Low | Low | Very Low | Negligible |
| OPT-14 | R2DBC LOCAL validation | Very Low | Low–Med | Low | Low |

---

### Recommended Execution Order

**Week 1** (zero-risk, config/small code changes):
OPT-1, OPT-2, OPT-3, OPT-4, OPT-5, OPT-11, OPT-12, OPT-13, OPT-14

**Week 2–3** (medium effort):
OPT-8, OPT-10, OPT-9

**Month 2** (architectural):
OPT-7, OPT-6

---

---

## Part 2 — Code Structure Reorganization

### Current Package Structure

```
com.service.backend/
├── admin/          controller/ dao/ dto/ service/
├── article/        controller/ dao/ dto/ service/
├── auth/           controller/ dao/ dto/ service/
├── chat/           controller/ dao/ dto/ service/ websocket/
├── config/         (AppConfig, SecurityConfig, R2dbcConfig, ...)
├── event/          controller/ dao/ dto/ service/
├── forum/          controller/ dao/ dto/ service/
├── fundraising/    controller/ dao/ dto/ service/ projection/
├── mentorship/     controller/ dao/ dto/ service/
├── organization/   controller/ dao/ dto/ service/
├── shared/         annotations/ bean/ controller/ cronjob/ dao/
│                   dto/ entity/ enums/ exception/ projection/
│                   service/ utils/
└── user/           controller/ dao/ dto/ service/
```

The structure is **feature-module-based** — which is correct. The problems are within and between modules.

---

### Structural Problems Found

#### PROBLEM 1: All 46 Entities Live in `shared/entity/` (High Priority)

Every domain entity (`Event`, `ForumPost`, `MentorProfile`, `ChatMessage`, etc.) is in
`shared/entity/` regardless of which module owns it. This forces every module to import from
`shared` just to reference its own data model, and makes `shared` a dump for unrelated concerns.

**Before**: `shared/entity/Event.java`, `shared/entity/ForumPost.java`, `shared/entity/ChatMessage.java`

**After**: Move entities to the module that owns them:
```
event/entity/Event.java
event/entity/EventTicket.java
event/entity/EventInterest.java
event/entity/EventQuestion.java
event/entity/EventEmailLog.java
event/entity/EventInvitation.java

forum/entity/ForumPost.java
forum/entity/ForumTopic.java
forum/entity/ForumCategory.java
forum/entity/ForumPostReaction.java
forum/entity/ForumPostReport.java
forum/entity/ForumTopicSubscription.java

chat/entity/ChatGroup.java
chat/entity/ChatGroupMember.java
chat/entity/ChatMessage.java
chat/entity/ChatConversationRequest.java
chat/entity/UserBlock.java

mentorship/entity/MentorProfile.java
mentorship/entity/MenteeProfile.java
mentorship/entity/MentorAvailability.java
mentorship/entity/MentorExpertise.java
mentorship/entity/MentorshipSession.java
mentorship/entity/MentorshipReport.java
mentorship/entity/SessionFeedback.java

fundraising/entity/Funds.java
fundraising/entity/FundDonations.java
fundraising/entity/FundReceivingInfos.java
fundraising/entity/FundStatus.java

article/entity/AlumniPost.java
article/entity/Achievement.java
article/entity/Job.java
article/entity/LearningResource.java
article/entity/News.java
article/entity/SavedItem.java

organization/entity/Organization.java
organization/entity/OrganizationMember.java
organization/entity/OrganizationIntroduction.java
organization/entity/SchoolFeedback.java

user/entity/User.java
user/entity/GlobalProfile.java
user/entity/VerificationRequest.java
user/entity/PeerVerification.java
user/entity/Notification.java
user/entity/UserLoginHistory.java
user/entity/UserNotificationSettings.java

# Stays in shared (truly cross-cutting):
shared/entity/AdminAuditLog.java
```

**Effort**: Medium (mechanical move + import update across ~200 files)  
**Risk**: Low — pure package rename; no logic changes; IDE refactor handles imports  
**Safety**: Safe (rename/move only)

---

#### PROBLEM 2: `admin` Module Bypasses Domain Services and Directly Imports Domain Repositories (High Priority)

`AdminForumService` imports `forum.dao.ForumTopicRepository`, `ForumPostRepository`,
`ForumPostReportRepository`, `ForumPostReactionRepository` directly — bypassing `ForumService`.  
`AdminEventService` imports `event.dao.EventR2dbcRepository`, `EventTicketR2dbcRepository`,
`EventInterestR2dbcRepository` directly.

This means admin logic duplicates business rules that already exist in domain services, and changes
to domain persistence require updates in two places.

**Before**: `AdminForumService` → `forum.dao.ForumTopicRepository` (direct)

**After**: `AdminForumService` → `ForumService` (via service interface)

Where the admin needs queries the domain service doesn't expose, add explicit admin-scoped query
methods to the domain service (e.g., `ForumService.adminGetReportedPosts(...)`), or define a
read-only `ForumQueryService` interface the admin module can depend on.

**Effort**: Medium–High (logic needs merging, not just moving)  
**Risk**: Medium — requires careful merge to avoid duplicating or breaking existing behavior  
**Safety**: Requires logic refactoring

---

#### PROBLEM 3: `NotificationService` Is in `user` Module but Is a Shared Cross-Cutting Concern (Medium Priority)

`user.service.NotificationService` is injected into 8+ services across completely separate modules:
`event`, `auth`, `mentorship` (×3), `admin`, `shared/cronjob` (×2), and `user` itself.

Having a service from the `user` module imported by `mentorship`, `event`, and `admin` is an
implicit downward dependency that makes `user` a hidden shared module.

**Fix**: Move `NotificationService` + `NotificationRepository` + `Notification` entity to `shared/`:
```
shared/service/NotificationService.java      (moved from user/service/)
shared/dao/NotificationRepository.java       (moved from user/dao/)
shared/entity/Notification.java              (moved from shared/entity/ — already there)
```
The `user` module controllers that expose notification endpoints keep thin controller wrappers
delegating to `shared.service.NotificationService`.

**Effort**: Low–Medium (move + import update)  
**Risk**: Low  
**Safety**: Safe (move only)

---

#### PROBLEM 4: `fundraising` Has Duplicate Repositories for `Organization` and `User` (Medium Priority)

`fundraising/dao/OrganizationR2dbcRepository.java` and `fundraising/dao/UserR2dbcRepository.java`
are duplicate interfaces — identical in declaration to `organization/dao/OrganizationRepository`
and `user/dao/UserProfileRepository`. Spring registers both as beans, which can cause
`NoUniqueBeanDefinitionException` at runtime and certainly causes confusion.

**Before**:
```java
// fundraising/dao/OrganizationR2dbcRepository.java
public interface OrganizationR2dbcRepository extends R2dbcRepository<Organization, Integer> {}

// Also exists at organization/dao/OrganizationRepository.java
```

**After**: Delete the two duplicates from `fundraising/dao/`. Update `FundService` to inject
`organization.dao.OrganizationRepository` and `user.dao.UserProfileRepository` directly.

**Effort**: Very Low  
**Risk**: Very Low  
**Safety**: Safe (delete duplicates, update 2 injection sites)

---

#### PROBLEM 5: Event Module Has Unnecessary Three-Layer Repository Abstraction (Low Priority)

The `event` module is the only module with: `EventR2dbcRepository` (Spring Data interface) +
`IEventRepository` (custom interface) + `EventRepository` (implementation class). Every other
module uses Spring Data interfaces directly. This adds 2 extra files with no benefit for the
current single-datasource setup.

**Before**:
```
event/dao/EventR2dbcRepository.java    (Spring Data interface)
event/dao/IEventRepository.java        (custom interface — 30+ method signatures)
event/dao/EventRepository.java         (implementation class — delegates to R2dbc repo)
```

**After**: Collapse into `EventR2dbcRepository` directly (add the custom `@Query` methods
to it). The service injects `EventR2dbcRepository` instead of `IEventRepository`.

**Effort**: Medium (EventRepository has non-trivial aggregation logic that needs folding in)  
**Risk**: Low  
**Safety**: Requires logic migration, but contained within the event module

---

#### PROBLEM 6: God Services — Logic Needs Vertical Slice Splitting (Medium Priority)

Four services exceed 500 lines and handle too many responsibilities:

| Service | Lines | Responsibilities to split |
|---|---|---|
| `event/service/EventService.java` | 722 | Event CRUD, ticket management, invitations, email reminders, check-in, questions — split into `EventService`, `EventTicketService`, `EventInvitationService` |
| `admin/service/AdminUserService.java` | 551 | User CRUD, verification, ban/unban, password reset, login history, org membership — split into `AdminUserService`, `AdminVerificationService` |
| `forum/service/ForumService.java` | 521 | Topics, posts, reactions, reports, subscriptions, categories — split into `ForumTopicService`, `ForumPostService`, `ForumModerationService` |
| `mentorship/service/MentorService.java` | 518 | Profile CRUD, availability, expertise, session queries — split into `MentorProfileService`, `MentorAvailabilityService` |

**Effort**: Medium per service  
**Risk**: Medium — split must preserve transactional boundaries  
**Safety**: Requires logic refactoring; start with `EventService` as it's largest and has cleanest seams

---

#### PROBLEM 7: Enums Scattered — Some Belong to Specific Modules (Low Priority)

`shared/enums/` contains 13 enums. Several are domain-specific and have no reason to be shared:

- `ChatMessageType`, `ChatRole`, `ChatType`, `ConversationRequestStatus` → `chat/enums/`
- `MentorshipSessionType` → `mentorship/enums/`
- `JobType`, `LearningResourceType` → `article/enums/`
- `QuestionType` → `event/enums/`
- `ReportReasonCategory` → `forum/enums/`

Keep in `shared/enums/`: `Status`, `UserRole`, `ErrorCode`, `DocumentType`, `ModerationTag`, `ForumPostTag`

**Effort**: Very Low  
**Risk**: Very Low  
**Safety**: Safe (move only)

---

### Reorganization Summary

| # | Problem | Effort | Risk | Safety |
|---|---|---|---|---|
| STR-1 | Move 46 entities to their domain modules | Medium | Low | Safe (rename/move) |
| STR-2 | Admin module: stop bypassing domain services | Medium–High | Medium | Logic refactoring |
| STR-3 | Move `NotificationService` to `shared/` | Low–Medium | Low | Safe (move) |
| STR-4 | Delete duplicate fundraising repositories | Very Low | Very Low | Safe (delete duplicates) |
| STR-5 | Collapse event 3-layer repo to 1 interface | Medium | Low | Logic migration (contained) |
| STR-6 | Split 4 god services (>500 lines) | Medium per service | Medium | Logic refactoring |
| STR-7 | Move domain-specific enums to their modules | Very Low | Very Low | Safe (move) |

---

### Recommended Order for Structural Changes

**Phase 1 — Zero-risk moves** (STR-4, STR-7, STR-3):
Delete fundraising duplicate repos, move domain enums, move NotificationService to shared.

**Phase 2 — Safe mechanical refactors** (STR-1):
Move entities to domain modules using IDE refactor (Update Usages). All import changes,
no logic changes.

**Phase 3 — Contained logic migrations** (STR-5, STR-6):
Collapse event repository layers. Split god services one at a time, starting with `EventService`.

**Phase 4 — Cross-module boundary enforcement** (STR-2):
Admin services depend on domain service interfaces instead of domain repositories.
This is the most impactful structural change and should be done last when module boundaries are clean.
