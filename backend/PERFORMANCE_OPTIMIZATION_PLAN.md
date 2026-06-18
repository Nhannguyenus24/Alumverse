# Backend Performance & Cost Optimization Plan

**Stack**: Spring Boot 3.5.9 (WebFlux/R2DBC) + PostgreSQL on Supabase + Render.com + Gemini AI  
**Date**: 2026-06-18

---

## Architecture Overview

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.5.9, WebFlux (reactive), R2DBC |
| Language | Java 17 |
| Database | PostgreSQL via Supabase (cloud-hosted, connection-pooled) |
| Cache | Caffeine in-memory only (no Redis) |
| Deployment | Render.com (single container) |
| AI | LangChain4j + Gemini API (moderation + forum tagging) |
| Storage | Local filesystem on Render + Nginx |
| Third-party | SMTP (Gmail), SePay webhook (payments), Google OAuth/reCAPTCHA |

---

## Priority 1 — High Impact, Low Effort

### OPT-1: Add `pg_trgm` Indexes for ILIKE Search Queries

**Problem**: 20+ queries use `LOWER(col) LIKE LOWER('%keyword%')` — full sequential scans on every search.

**Affected files**:
- `forum/dao/ForumTopicRepository.java` — 6 LIKE queries on `title`
- `forum/dao/ForumPostRepository.java` — 4 LIKE queries on `content`
- `admin/dao/AdminUserRepository.java` — 6 ILIKE queries across `email`, `student_id`, `full_name`
- `event/dao/EventTicketR2dbcRepository.java` — 8+ LIKE conditions

**Fix**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_email_trgm          ON users           USING GIN (email gin_trgm_ops);
CREATE INDEX idx_global_profiles_name_trgm ON global_profiles USING GIN (full_name gin_trgm_ops);
CREATE INDEX idx_forum_topics_title_trgm   ON forum_topics    USING GIN (title gin_trgm_ops);
CREATE INDEX idx_forum_posts_content_trgm  ON forum_posts     USING GIN (content gin_trgm_ops);
-- Also add B-tree indexes on common filter columns:
CREATE INDEX idx_users_status   ON users   (status);
CREATE INDEX idx_users_role     ON users   (role);
CREATE INDEX idx_notifications_member ON notifications (member_id);
CREATE INDEX idx_verification_status  ON verification_requests (status);
```

**Effort**: Low | **Risk**: Very Low | **Cost Saving**: High (reduces Supabase DB CPU)

---

### OPT-2: Fix BCrypt Blocking the Event Loop

**Problem**: `passwordEncoder.encode()` (~100ms CPU-intensive) is called synchronously on the Netty I/O
thread in `AdminUserService` and `UserService`. This blocks the entire event loop for that duration.
`AuthService.java:91` already does this correctly.

**Affected files**:
- `admin/service/AdminUserService.java` — lines 132, 155, 416, 455
- `user/service/UserService.java` — line 194

**Fix**:
```java
// Before (blocks event loop):
return passwordEncoder.encode(password);

// After (offloads to boundedElastic thread pool):
return Mono.fromCallable(() -> passwordEncoder.encode(password))
           .subscribeOn(Schedulers.boundedElastic());
```

**Effort**: Low | **Risk**: Very Low | **Cost Saving**: Medium

---

### OPT-3: Paginate Unbounded Notifications Query

**Problem**: `NotificationRepository.findByMemberIdOrderByCreatedAtDesc()` has no LIMIT — loads the
entire notification history into heap on every request.

**Affected file**: `user/dao/NotificationRepository.java:17`

**Fix**: Add `LIMIT :limit OFFSET :offset`, update `NotificationService.getMyNotifications()` to
accept `page` and `size` parameters (default 20-50 items).

**Effort**: Low | **Risk**: Very Low | **Cost Saving**: Medium

---

### OPT-4: Remove 163 Full-Object Log Serializations in Production

**Problem**: Every service method calls `JsonUtils.toJson(result)` inside `doOnSuccess` log callbacks.
Every DB response is JSON-serialized twice (once for HTTP response, once for log). Wastes CPU
proportional to response size.

**Fix**: Change `log.info("... result: {}", JsonUtils.toJson(obj))` → `log.debug("... result: {}", obj)`.
Debug level is suppressed in production so the serialization never runs.

**Effort**: Low (mechanical find-replace across all service files) | **Risk**: Very Low | **Cost Saving**: Medium

---

### OPT-5: Fix R2DBC Connection Pool Config for Supabase

**Problem**: `max-size=30` exceeds Supabase free tier's 20 direct connection limit. Using
transaction-mode PgBouncer URL with R2DBC (which has its own pool) can break prepared statements.

**Affected file**: `src/main/resources/application.properties` lines 15-26

**Fix**:
```properties
spring.r2dbc.pool.max-size=15
spring.r2dbc.pool.max-idle-time=10m
spring.r2dbc.pool.max-life-time=30m
# Use session-mode pooler URL (not transaction-mode) for R2DBC
```

**Effort**: Low (config only) | **Risk**: Medium — test in staging first | **Cost Saving**: High (prevents connection exhaustion)

---

## Priority 2 — High Impact, Medium Effort

### OPT-6: Move Images from Render Local Disk to CDN Object Storage

**Problem**: Images stored on Render local filesystem are **wiped on every redeploy**. No CDN layer,
so every image request hits the origin. `getImagesDirectorySize()` walks the filesystem on every
Prometheus scrape.

**Affected file**: `shared/service/ImageService.java`

**Fix**: Migrate to Cloudflare R2 (zero egress cost) or Supabase Storage (already in plan).
- Upload via SDK from backend
- Serve via CDN URL (`image.domain` property)
- Remove `getImagesDirectorySize()` Prometheus gauge

**Effort**: Medium | **Risk**: Medium (migrate existing images) | **Cost Saving**: High (eliminates ~$7/mo Render disk, adds CDN)

---

### OPT-7: Replace Base64 Uploads with Multipart / Pre-signed URLs

**Problem**: All image/file uploads transmitted as Base64 JSON strings — 33% size inflation, requires
20MB codec buffer (`spring.codec.max-in-memory-size=20MB`), causes JVM heap pressure on every upload.

**Affected files**: `shared/controller/ImageController.java`, `shared/controller/FileUploadController.java`,
all services with `base64String` fields (EventService, FundService, UserService, etc.)

**Fix**:
1. Switch endpoints to `multipart/form-data` (WebFlux `FilePart`)
2. Long-term: pre-signed upload URLs so backend never touches the binary

**Effort**: Medium | **Risk**: Medium (frontend change required) | **Cost Saving**: High

---

### OPT-8: Gate and Batch Gemini API Calls

**Problem**: Gemini is called inline on every forum post creation (moderation). Nightly batch tagger
has no cap on API calls per run. Direct dollar cost with no off switch.

**Affected files**: `shared/cronjob/ForumPostTagScheduler.java`, `shared/service/AITagService.java`

**Fix**:
1. Add feature flag: `gemini.tagging.enabled=true/false` in `application.properties`
2. Add configurable batch cap: `gemini.tagging.max-posts-per-run=100`
3. Raise scheduler interval to `0 0 3 * * *` (once daily at 3AM) if real-time tagging not required

**Effort**: Low-Medium | **Risk**: Low | **Cost Saving**: High (direct API spend control)

---

### OPT-9: Redis for OTP / Auth-Critical Cache (Upstash Free Tier)

**Problem**: OTPs stored in Caffeine in-memory cache (`shared/utils/CacheUtils.java`). On multi-instance
Render deployments, OTPs from instance A are invisible to instance B — users get intermittent
"OTP expired" errors. Also: cache is wiped on every instance restart (Render free tier sleeps instances).

**Fix**: Replace auth-critical cache entries with Upstash Redis (serverless, free tier: 10k cmds/day).
Use Spring WebFlux `ReactiveRedisTemplate`. Keep Caffeine for non-critical caches.

**Effort**: Medium | **Risk**: Medium | **Cost Saving**: Medium + correctness guarantee

---

### OPT-10: Admin Dashboard Cache TTL + Consolidate 8 Parallel DB Queries

**Problem**: `AdminDashboardService.getMetrics()` fires 8 parallel DB queries (`Mono.zip`) on every
5-minute cache miss. On Render free tier (instances sleep after 15min), cache is always cold on
first request after wake-up.

**Affected file**: `admin/service/AdminDashboardService.java:41-78`

**Fix**:
1. Increase TTL to 15 minutes
2. Consolidate 8 queries into 1 SQL summary view/function
3. Add background refresh (scheduled every 10min) so cache is never cold on user request

**Effort**: Medium | **Risk**: Low (slightly stale data is acceptable for analytics) | **Cost Saving**: Low-Medium

---

## Priority 3 — Quick Wins (Very Low Effort)

### OPT-11: Reduce Mentorship Cron Frequency
**Problem**: `MentorshipSessionStatusTask` runs every 5 min → 864 scheduled DB queries/day minimum.  
**Fix**: Change `0 */5 * * * *` → `0 */15 * * * *` (saves 66% of scheduled load).  
**File**: `shared/cronjob/MentorshipSessionStatusTask.java:31`  
**Effort**: Very Low | **Risk**: Low (max 15min delay in status transitions) | **Cost Saving**: Low

### OPT-12: Disable Swagger UI in Production
**Problem**: `springdoc.swagger-ui.enabled=true` not disabled in prod profile — classpath scanning on
every startup, Swagger webjars served unnecessarily.  
**Fix**: Add to `application-prod.properties`:
```properties
springdoc.swagger-ui.enabled=false
springdoc.api-docs.enabled=false
```
**Effort**: Very Low | **Risk**: Very Low | **Cost Saving**: Negligible (reduces attack surface)

### OPT-13: Pre-compile CORS Regex Patterns
**Problem**: `SecurityConfig.corsConfigurationSource()` recompiles regex patterns from strings on every
non-OPTIONS request.  
**File**: `config/SecurityConfig.java:168-181`  
**Fix**: Pre-compile to `java.util.regex.Pattern` objects at bean initialization.  
**Effort**: Very Low | **Risk**: Very Low | **Cost Saving**: Negligible

### OPT-14: R2DBC LOCAL Validation + Connection Lifetime
**Problem**: `validation-query=SELECT 1` does full DB round-trip per idle connection validation.  
**Fix**: Use `validationDepth=LOCAL` + `max-life-time` to recycle long-lived connections before
Supabase force-closes them.  
**Effort**: Very Low | **Risk**: Low | **Cost Saving**: Low

---

## Summary Table

| # | Optimization | Effort | Impact | Risk | Cost Saving |
|---|---|---|---|---|---|
| OPT-1 | pg_trgm indexes for ILIKE search | Low | High | Very Low | High |
| OPT-2 | BCrypt off event loop | Low | Medium | Very Low | Medium |
| OPT-3 | Paginate notifications query | Low | Medium | Very Low | Medium |
| OPT-4 | Remove 163 log serializations | Low | Medium | Very Low | Medium |
| OPT-5 | Fix R2DBC pool config for Supabase | Low | High | Medium | High |
| OPT-6 | Local disk → CDN object storage | Medium | High | Medium | High |
| OPT-7 | Base64 → multipart/pre-signed uploads | Medium | High | Medium | High |
| OPT-8 | Gate/batch Gemini API calls | Low-Medium | Medium | Low | High |
| OPT-9 | Redis for OTP/auth cache | Medium | High | Medium | Medium |
| OPT-10 | Dashboard cache TTL + single query | Medium | Medium | Low | Low-Medium |
| OPT-11 | Reduce mentorship cron to 15min | Very Low | Low-Medium | Low | Low |
| OPT-12 | Disable Swagger in production | Very Low | Low | Very Low | Negligible |
| OPT-13 | Pre-compile CORS regex patterns | Very Low | Low | Very Low | Negligible |
| OPT-14 | R2DBC LOCAL validation + lifetime | Very Low | Low-Medium | Low | Low |

---

## Recommended Execution Timeline

### Week 1 — Zero Risk, Config + Small Code Changes
- [ ] OPT-1 — Add pg_trgm indexes (pure SQL DDL, no code change)
- [ ] OPT-2 — Fix BCrypt blocking in AdminUserService (3-line change)
- [ ] OPT-3 — Paginate notifications (query + service update)
- [ ] OPT-4 — Change 163 log calls to debug level (find-replace)
- [ ] OPT-5 — Fix R2DBC pool config (application.properties)
- [ ] OPT-11 — Increase mentorship cron interval
- [ ] OPT-12 — Disable Swagger in production profile
- [ ] OPT-13 — Pre-compile CORS regex
- [ ] OPT-14 — R2DBC LOCAL validation

### Week 2–3 — Medium Effort, Medium Impact
- [ ] OPT-8 — Add Gemini feature flag + batch size cap
- [ ] OPT-10 — Increase dashboard cache TTL + consolidate queries
- [ ] OPT-9 — Introduce Redis (Upstash free tier) for OTP cache

### Month 2 — Architectural Changes
- [ ] OPT-7 — Replace base64 uploads with multipart (frontend + backend)
- [ ] OPT-6 — Migrate images to Cloudflare R2 / Supabase Storage
- [ ] WebSocket pub/sub (only if scaling beyond 1 Render instance)

---

## Biggest Cost Levers

1. **Gemini API spend** — OPT-8 (direct dollar cost, no cap today)
2. **Supabase DB CPU** — OPT-1 (sequential scans on every search)
3. **R2DBC connection exhaustion** — OPT-5 (exceeds free tier limits → expensive retries)
4. **Render persistent disk** — OPT-6 (~$7/mo + images lost on redeploy)

---

# Code Structure Reorganization Plan

The feature-based module layout (`event/`, `forum/`, `mentorship/`, etc.) is correct.
The problems are *within and between* modules.

---

## Current Structure Problems

### STR-1: All 46 Entities Dumped in `shared/entity/` — High Priority

**Problem**: Domain-specific entities (`Event`, `ForumPost`, `ChatMessage`, `MentorProfile`, etc.)
all live in `shared/entity/` — making `shared/` a catch-all instead of a package for genuinely
cross-cutting concerns.

**Fix**: Move each entity to its owning module:
```
Before:
  shared/entity/Event.java
  shared/entity/ForumPost.java
  shared/entity/ChatMessage.java
  shared/entity/MentorProfile.java

After:
  event/entity/Event.java
  forum/entity/ForumPost.java
  chat/entity/ChatMessage.java
  mentorship/entity/MentorProfile.java
```

**Effort**: Low (pure package move, IDE handles imports) | **Risk**: Low

---

### STR-2: `admin` Module Bypasses Domain Services — High Priority

**Problem**: `AdminForumService` imports `forum.dao.*` directly; `AdminEventService` imports
`event.dao.*` directly — skipping domain services entirely. Business rules can diverge silently
between admin and user-facing code paths.

**Fix**: Admin services depend on domain service interfaces, not repositories:
```java
// Before (layering violation):
@Autowired ForumTopicR2dbcRepository forumRepo; // in AdminForumService

// After (correct):
@Autowired ForumTopicService forumTopicService;
```

**Effort**: Medium | **Risk**: Medium (need to verify admin-specific logic doesn't duplicate domain logic)

---

### STR-3: `NotificationService` Lives in `user/` but Used by 8 Modules — Medium Priority

**Problem**: `user/service/NotificationService` is injected into `event`, `auth`, `mentorship` (×3),
`admin`, and `shared/cronjob`. It's a shared concern, not a user-domain concern.

**Fix**: Move to `shared/service/NotificationService.java`.

**Effort**: Low (move + update 8 import sites) | **Risk**: Very Low

---

### STR-4: `fundraising` Has Duplicate Repositories — Easy Fix

**Problem**: `fundraising/dao/OrganizationR2dbcRepository` and `fundraising/dao/UserR2dbcRepository`
are duplicates of repos that already exist in `organization/` and `user/`. Two Spring beans registered
for the same table — potential transactional inconsistency.

**Fix**: Delete both duplicate repos, update the 2 injection sites in `fundraising/` to use the
canonical repos from their owning modules.

**Effort**: Very Low | **Risk**: Low

---

### STR-5: Event Module Has 3-Layer Repository Abstraction — Medium Priority

**Problem**: `event/` has `EventR2dbcRepository` + `IEventRepository` (interface) + `EventRepository`
(implementation class). No other module follows this pattern — all others use Spring Data interfaces
directly with `@Query`. This adds indirection with no benefit.

**Fix**: Collapse into one `EventR2dbcRepository` with `@Query` methods, matching the pattern used
by every other module.

**Effort**: Medium | **Risk**: Medium (verify no custom transaction logic in the implementation class)

---

### STR-6: 4 God Services Over 500 Lines — Medium Priority (per service)

| Service | Lines | Split into |
|---|---|---|
| `event/service/EventService.java` | 722 | `EventService`, `EventTicketService`, `EventInvitationService` |
| `admin/service/AdminUserService.java` | 551 | `AdminUserService`, `AdminVerificationService` |
| `forum/service/ForumService.java` | 521 | `ForumTopicService`, `ForumPostService`, `ForumModerationService` |
| `mentorship/service/MentorService.java` | 518 | `MentorProfileService`, `MentorAvailabilityService` |

**Fix**: Extract by responsibility — each new service handles one cohesive subdomain.
Controllers already have separate endpoints that map cleanly to these splits.

**Effort**: Medium per service | **Risk**: Medium (verify Spring injection sites after split)

---

### STR-7: Domain Enums Placed in `shared/enums/` — Easy Fix

**Problem**: `ChatMessageType`, `ChatRole`, `MentorshipSessionType`, `JobType`, `QuestionType`,
`ReportReasonCategory` etc. have no cross-module usage — they belong in their domain.

**Fix**:
```
Before:
  shared/enums/ChatMessageType.java
  shared/enums/MentorshipSessionType.java

After:
  chat/enums/ChatMessageType.java
  mentorship/enums/MentorshipSessionType.java
```
Keep only genuinely shared enums (e.g., `UserRole`, `Status`) in `shared/enums/`.

**Effort**: Very Low | **Risk**: Very Low

---

## Structure Reorganization Summary Table

| # | Issue | Effort | Risk | Priority |
|---|---|---|---|---|
| STR-1 | 46 entities in `shared/entity/` | Low | Low | High |
| STR-2 | `admin` bypasses domain services | Medium | Medium | High |
| STR-3 | `NotificationService` in wrong module | Low | Very Low | Medium |
| STR-4 | Duplicate repos in `fundraising` | Very Low | Low | Easy fix |
| STR-5 | Event module 3-layer repo abstraction | Medium | Medium | Medium |
| STR-6 | 4 god services 500+ lines | Medium each | Medium | Medium |
| STR-7 | Domain enums in `shared/enums/` | Very Low | Very Low | Easy fix |

---

## Recommended Refactoring Order

**Step 1 — Safe moves (no logic change, just package restructuring)**
1. STR-4 — Delete duplicate `fundraising` repos (2 files deleted)
2. STR-7 — Move domain enums to their owning modules
3. STR-3 — Move `NotificationService` to `shared/service/`
4. STR-1 — Move entities from `shared/entity/` to module `entity/` sub-packages

**Step 2 — Logic restructuring (requires careful verification)**
5. STR-5 — Collapse event 3-layer repo into single Spring Data interface
6. STR-6 — Split god services (one service at a time, start with `EventService`)

**Step 3 — Boundary enforcement (hardest, most impactful)**
7. STR-2 — Enforce admin → domain service dependency (not admin → repo)
