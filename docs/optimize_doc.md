Backend Refactoring Plan
  ---
  Phase 2 — Eliminate Code Duplication (Medium-High Priority)
  
  2.1 Extract a PaginationHelper utility
  - The offset-calculation + zipWith(count) + PaginatedResponse.of() pattern appears in 20+ services
  - Create a single generic helper:
  PaginationHelper.paginate(Flux<T> items, Mono<Long> total, int page, int size)
  - Reduces ~40 lines to 1 call per service

  2.2 Introduce a ReactiveUtils helper for error-handling chains
  - The .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NOT_FOUND))) + log pattern is in 100+ methods
  - Extract named methods:
  ReactiveUtils.requireFound(Mono<T>)
  ReactiveUtils.logOnError(String context)
  
  2.3 Create mapper classes (per module)
  - Every service has 10–15 private DTO conversion methods
  - Extract to @Component mappers (e.g., ForumMapper, EventMapper, FundMapper)
  - Keeps service methods focused on business logic, not mapping

  2.4 Delegate admin services to domain services
  - AdminForumService, AdminEventService, AdminUserService each duplicate logic from their domain counterparts
  - Admin services should call/extend domain services rather than re-implement queries
  - This is the largest single source of duplication in the codebase

  ---
  Phase 3 — Service Class Decomposition (Medium Priority)
  
  Large service classes exceed 600+ lines and handle too many responsibilities:

  ┌──────────────────────────┬───────┬─────────────────────────────────────────────────────────────┐
  │         Service          │ Lines │                         Split into                          │
  ├──────────────────────────┼───────┼─────────────────────────────────────────────────────────────┤
  │ FundService              │ 731   │ FundQueryService, FundCommandService, FundDonationService   │
  ├──────────────────────────┼───────┼─────────────────────────────────────────────────────────────┤
  │ AdminForumService        │ 680   │ AdminForumModerationService, AdminForumStatsService         │
  ├──────────────────────────┼───────┼─────────────────────────────────────────────────────────────┤
  │ ChatService              │ 639   │ ChatMessageService, ChatGroupService, ChatConnectionService │
  ├──────────────────────────┼───────┼─────────────────────────────────────────────────────────────┤
  │ AdminOrganizationService │ 623   │ AdminOrgVerificationService, AdminOrgManagementService      │
  └──────────────────────────┴───────┴─────────────────────────────────────────────────────────────┘

  ---
  Phase 4 — Structural / Architectural Cleanup (Medium Priority)

  4.1 Shared response wrapper consistency
  - Verify all endpoints return ApiResponse<T> — some return raw objects
  - Standardize error shape across GlobalExceptionHandler

  4.2 Consistent null-handling in Reactive chains
  - Mix of .defaultIfEmpty(), .switchIfEmpty(), and raw null checks
  - Settle on one pattern project-wide

  4.3 Reduce logging verbosity
  - JsonUtils.toJson() is called on every success — expensive for high-volume endpoints
  - Replace with lazy log suppliers or structured log fields (MDC)

  4.4 JSON-as-text columns
  - Fields like imageUrls, leaders, teamMembers are stored as JSON strings and parsed manually
  - If schema is under your control, migrate to PostgreSQL jsonb; otherwise wrap parsing in a shared converter

  ---
  Phase 5 — Low Priority / Nice-to-Have
  4.2 Consistent null-handling in Reactive chains
  - Mix of .defaultIfEmpty(), .switchIfEmpty(), and raw null checks
  - Settle on one pattern project-wide

  4.3 Reduce logging verbosity
  - JsonUtils.toJson() is called on every success — expensive for high-volume endpoints
  - Replace with lazy log suppliers or structured log fields (MDC)

  4.4 JSON-as-text columns
  - Fields like imageUrls, leaders, teamMembers are stored as JSON strings and parsed manually
  - If schema is under your control, migrate to PostgreSQL jsonb; otherwise wrap parsing in a shared converter

  ---
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments
  - Mix of .defaultIfEmpty(), .switchIfEmpty(), and raw null checks
  - Settle on one pattern project-wide

  4.3 Reduce logging verbosity
  - JsonUtils.toJson() is called on every success — expensive for high-volume endpoints
  - Replace with lazy log suppliers or structured log fields (MDC)

  4.4 JSON-as-text columns
  - Fields like imageUrls, leaders, teamMembers are stored as JSON strings and parsed manually
  - If schema is under your control, migrate to PostgreSQL jsonb; otherwise wrap parsing in a shared converter

  ---
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments
  - Settle on one pattern project-wide

  4.3 Reduce logging verbosity
  - JsonUtils.toJson() is called on every success — expensive for high-volume endpoints
  - Replace with lazy log suppliers or structured log fields (MDC)

  4.4 JSON-as-text columns
  - Fields like imageUrls, leaders, teamMembers are stored as JSON strings and parsed manually
  - If schema is under your control, migrate to PostgreSQL jsonb; otherwise wrap parsing in a shared converter

  ---
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments

  4.4 JSON-as-text columns
  - Fields like imageUrls, leaders, teamMembers are stored as JSON strings and parsed manually
  - If schema is under your control, migrate to PostgreSQL jsonb; otherwise wrap parsing in a shared converter

  ---
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments
  - Fields like imageUrls, leaders, teamMembers are stored as JSON strings and parsed manually
  - If schema is under your control, migrate to PostgreSQL jsonb; otherwise wrap parsing in a shared converter

  ---
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments

  ---
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments
  - Missing @Transactional boundaries on multi-step write operations in R2DBC

  - Missing @Transactional boundaries on multi-step write operations in R2DBC

  ---
  Suggested Execution Order
  ---
  Suggested Execution Order


  Phase 1 → Phase 2.1 → Phase 2.2 → Phase 2.3 → Phase 2.4 → Phase 3 → Phase 4
  - Mix of .defaultIfEmpty(), .switchIfEmpty(), and raw null checks
  - Settle on one pattern project-wide

  4.3 Reduce logging verbosity
  - JsonUtils.toJson() is called on every success — expensive for high-volume endpoints
  - Replace with lazy log suppliers or structured log fields (MDC)

  4.4 JSON-as-text columns
  - Fields like imageUrls, leaders, teamMembers are stored as JSON strings and parsed manually
  - If schema is under your control, migrate to PostgreSQL jsonb; otherwise wrap parsing in a shared converter

  ---
  Phase 5 — Low Priority / Nice-to-Have

  - Backpressure on Flux operations with large result sets (add .limitRate() or buffer)
  - Distributed cache (Redis) to replace Caffeine for multi-instance deployments
  - Missing @Transactional boundaries on multi-step write operations in R2DBC

  ---
  Suggested Execution Order

  Phase 1 → Phase 2.1 → Phase 2.2 → Phase 2.3 → Phase 2.4 → Phase 3 → Phase 4

  Start with Phase 1 (no behavior change, pure risk reduction), then tackle the pagination and error-handling helpers (Phase
  2.1/2.2) since they touch every module and prove the pattern before the larger mapper/admin-delegation work.

  ---
  Want me to start implementing any specific phase? I'd suggest beginning with Phase 2.1 (PaginationHelper) as it's the
  highest-yield, lowest-risk change — one new class, 20+ call sites simplified.