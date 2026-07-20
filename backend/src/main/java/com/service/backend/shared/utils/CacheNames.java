package com.service.backend.shared.utils;

/**
 * Single source of truth for every Caffeine cache name used with {@link CacheUtils}.
 * <p>
 * Keeping the names here (instead of scattered string literals in each service) ensures the
 * reader that populates a cache and the writer that evicts it can never drift apart on a rename.
 * When adding a new read-through cache, declare its name here and reference the constant from
 * both the {@code getOrCompute} read and every {@code clear}/{@code evict} on writes that change it.
 */
public final class CacheNames {

    private CacheNames() {
    }

    // ── Organization (shared config) ──────────────────────────────────────────
    public static final String ORGANIZATION = "organization_cache";

    // ── Content feeds (public / org-scoped lists) ─────────────────────────────
    public static final String EVENT = "event_cache";
    public static final String NEWS = "news_cache";
    public static final String JOB = "job_cache";
    public static final String ALUMNI_POST = "alumni_post_cache";
    public static final String LEARNING_RESOURCE = "learning_resource_cache";
    public static final String ACHIEVEMENT = "achievement_cache";

    // ── Forum ─────────────────────────────────────────────────────────────────
    // Note: topic and post lists are intentionally NOT cached — the post list is per-viewer
    // (personalized "liked" flags) and increments view counts on every read, and the topic list
    // carries per-topic post counts that change on every new post. Both are poor cache candidates.
    public static final String FORUM_CATEGORY = "forum_category_cache";
    /** Written by ForumService.createPost, consumed by ForumNotificationTask (cron). Not a read-through list cache. */
    public static final String FORUM_RECENT_POSTS = "forumRecentPosts";

    // ── Mentorship ─────────────────────────────────────────────────────────────
    // Note: mentor-browse lists are intentionally NOT cached — each result is rendered per-viewer
    // (full profile vs preview via MentorshipAccessService.canViewFullMentorBrowse), so a shared cache
    // would leak full profiles to preview-only viewers. Left uncached for correctness.

    // ── Fundraising ────────────────────────────────────────────────────────────
    public static final String FUND_RECEIVING_INFOS = "fund_receiving_infos";
    public static final String FUND_STATISTICS = "fund_statistics";
    public static final String FUND_BANKS = "fund-banks";

    // ── Admin dashboards / aggregates (TTL-based staleness by design) ──────────
    public static final String ADMIN_CONTENT_STATISTICS = "admin_content_statistics";
    public static final String ADMIN_METRICS = "admin:metrics";
    public static final String ADMIN_FUNNELS = "admin:funnels";
    public static final String ADMIN_COHORTS = "admin:cohorts";
    public static final String ADMIN_ENGAGEMENT = "admin:engagement";
    public static final String ADMIN_PLATFORM = "admin:platform";

    // ── Auth (OTP / email change flows) ────────────────────────────────────────
    public static final String OTP_VERIFICATION = "otp_verification";
    public static final String CHANGE_EMAIL_OLD = "change_email_old";
    public static final String CHANGE_EMAIL_NEW = "change_email_new";
    public static final String CHANGE_EMAIL_VERIFIED = "change_email_verified";
}
