package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

const endpointInventory = `
/api/admin/ai-providers
/api/admin/ai-providers/{aiProviderId}
/api/admin/articles/news
/api/admin/articles/alumni-posts
/api/admin/articles/achievements
/api/admin/articles/jobs
/api/admin/articles/learning-resources
/api/admin/articles/events
/api/admin/articles/funds
/api/admin/articles/statistics
/api/admin/dashboard/metrics
/api/admin/dashboard/activities
/api/admin/dashboard/funnels
/api/admin/dashboard/cohorts
/api/admin/dashboard/engagement
/api/admin/dashboard/platform
/api/admin/education-requests?organizationId={organizationId}
/api/admin/email-templates
/api/admin/email-templates/{emailTemplateId}
/api/admin/events
/api/admin/events/search?keyword=test
/api/admin/events/by-status?isPublished=true
/api/admin/events/{eventId}
/api/admin/events/{eventId}/tickets
/api/admin/events/{eventId}/interests
/api/admin/events/statistics
/api/admin/forum/admin/posts/yesterday
/api/admin/forum/admin/posts/yesterday/paginated
/api/admin/forum/admin/posts/hidden/list
/api/admin/forum/admin/posts/banned/list
/api/admin/forum/admin/posts
/api/admin/forum/reports
/api/admin/forum/admin/categories?organizationId={organizationId}
/api/admin/forum/admin/categories/{categoryId}
/api/admin/forum/admin/topics
/api/admin/forum/admin/topics/{topicId}
/api/admin/forum/admin/statistics
/api/admin/forum/admin/statistics/top-contributors?month={month}&year={year}
/api/admin/forum/admin/statistics/engagement
/api/admin/forum/admin/statistics/timeline?year={year}
/api/admin/fundraising/statistics
/api/admin/fundraising/funds/{fundId}/donations/all
/api/admin/mentorship/sessions
/api/admin/mentorship/sessions/by-status?status=PENDING
/api/admin/mentorship/sessions/{sessionId}
/api/admin/mentorship/mentees
/api/admin/mentorship/reports
/api/admin/mentorship/mentors
/api/admin/mentorship/mentors/by-status?status=APPROVED
/api/admin/mentorship/statistics
/api/admin/organizations
/api/admin/organizations/{organizationId}
/api/admin/organizations/feedbacks
/api/admin/organizations/feedback-statistics
/api/admin/organizations/slug/{organizationSlug}
/api/admin/organizations/{organizationId}/programs
/api/admin/organizations/{organizationId}/majors
/api/admin/organizations/{organizationId}/features-config
/api/admin/organizations/{organizationId}/features-config/site-identity
/api/admin/organizations/{organizationId}/features-config/brand
/api/admin/organizations/{organizationId}/features-config/features
/api/admin/organizations/{organizationId}/features-config/features/events
/api/admin/organizations/{organizationId}/features-config/privacy
/api/admin/surveys
/api/admin/surveys/{surveyId}
/api/admin/surveys/{surveyId}/submissions
/api/admin/surveys/{surveyId}/summary
/api/admin/surveys/{surveyId}/insight
/api/admin/users
/api/admin/users/{userId}
/api/admin/users/{userId}/verification-requests
/api/admin/users/{userId}/peer-verifications
/api/admin/users/verification-requests
/api/admin/users/{userId}/activity
/api/admin/users/alumni/verification-requests
/api/admin/users/growth-statistics
/api/admin/users/verification-statistics
/api/admin/users/admin-actions
/api/admin/users/{adminUserId}/admin-actions
/api/admin/audit/login-history
/api/admin/audit/login-history/user/{userId}
/api/admin/audit/login-history/stats
/api/admin/audit/login-history/suspicious
/api/admin/audit/actions
/api/admin/audit/actions/facets
/api/admin/audit/actions/summary
/api/admin/audit/actions/export
/api/articles/achievements/{achievementId}?organizationId={organizationId}
/api/articles/achievements?organizationId={organizationId}
/api/articles/achievements/member/{memberId}?organizationId={organizationId}
/api/articles/achievements/my
/api/articles/achievements/status/{achievementStatus}?organizationId={organizationId}
/api/articles/achievements/search?keyword=test&organizationId={organizationId}
/api/articles/alumni-posts/{alumniPostId}/comments
/api/articles/alumni-posts/{alumniPostId}?organizationId={organizationId}
/api/articles/alumni-posts/slug/{alumniPostSlug}?organizationId={organizationId}
/api/articles/alumni-posts?organizationId={organizationId}
/api/articles/alumni-posts/published?organizationId={organizationId}
/api/articles/alumni-posts/user/{userId}?organizationId={organizationId}
/api/articles/alumni-posts/search?keyword=test&organizationId={organizationId}
/api/articles/jobs/{jobId}?organizationId={organizationId}
/api/articles/jobs?organizationId={organizationId}
/api/articles/jobs/active?organizationId={organizationId}
/api/articles/jobs/open?organizationId={organizationId}
/api/articles/jobs/search?keyword=test&organizationId={organizationId}
/api/articles/learning-resources/{learningResourceId}?organizationId={organizationId}
/api/articles/learning-resources?organizationId={organizationId}
/api/articles/learning-resources/type/{learningResourceType}
/api/articles/learning-resources/search?keyword=test&organizationId={organizationId}
/api/articles/news/{newsId}/comments
/api/articles/news/{newsId}?organizationId={organizationId}
/api/articles/news/slug/{newsSlug}?organizationId={organizationId}
/api/articles/news?organizationId={organizationId}
/api/articles/news/published?organizationId={organizationId}
/api/articles/news/search?keyword=test&organizationId={organizationId}
/api/articles/saved/check?itemType=NEWS&itemId={newsId}
/api/articles/saved
/api/articles/saved/type/NEWS
/api/chat/groups
/api/chat/private/list
/api/chat/unread-count
/api/chat/private/{memberId}/status
/api/chat/private?targetMemberId={memberId}
/api/chat/groups/{groupId}/messages
/api/chat/groups/{groupId}/members
/api/chat/groups/{groupId}/blocked-members-context
/api/chat/groups/{groupId}/info
/api/chat/conversation-requests/connection-status?targetMemberId={memberId}
/api/chat/conversation-requests/search
/api/chat/recent-previews
/api/chat/connections/search?query=test
/api/chat/network/members
/api/chat/blocks
/api/chat/blocks/{memberId}
/api/events/{eventId}/comments
/api/events/{eventId}
/api/events
/api/events/upcoming
/api/events/ongoing
/api/events/past?organizationId={organizationId}
/api/events/search?organizationId={organizationId}&keyword=test
/api/events/my-interests
/api/events/{eventId}/interest/check
/api/events/{eventId}/check-registered
/api/events/{eventId}/interests
/api/events/{eventId}/invitations
/api/events/{eventId}/email-logs
/api/events/tickets/code/{ticketCode}
/api/events/{eventId}/tickets
/api/events/my-tickets
/api/events/{eventId}/statistics
/api/events/{eventId}/questions
/api/forum/category?organizationId={organizationId}
/api/forum/category/{categoryId}
/api/forum/topic/{topicId}
/api/forum/topic/search?title=test&organizationId={organizationId}
/api/forum/topic?categoryId={categoryId}
/api/forum/topic/{topicId}/is-subscribed?memberId={memberId}
/api/forum/post?topicId={topicId}
/api/forum/post/{postId}/reactions/count
/api/forum/post/{postId}/reactions/user?memberId={memberId}
/api/funds?organizationId={organizationId}
/api/funds/banks?organizationId={organizationId}
/api/funds/{fundId}
/api/funds/statistics?organizationId={organizationId}
/api/fund-donations/{fundId}
/api/fund-donations/user/{userId}
/api/funds/receiving-infos
/api/funds/receiving-infos/active
/api/mentorship/mentee/mentors
/api/mentorship/mentee/mentors/{mentorMemberId}
/api/mentorship/mentee/mentors/search?keyword=test
/api/mentorship/mentee/mentors/filter
/api/mentorship/mentee/skills
/api/mentorship/mentee/mentors/{mentorMemberId}/expertise
/api/mentorship/mentee/mentors/{mentorMemberId}/availability
/api/mentorship/mentee/profile
/api/mentorship/mentee/sessions/check-conflict?availabilityId={availabilityId}
/api/mentorship/mentee/sessions
/api/mentorship/mentee/sessions/{sessionId}
/api/mentorship/mentee/mentors/{mentorMemberId}/feedbacks
/api/mentorship/mentor/profile
/api/mentorship/mentor/expertise
/api/mentorship/mentor/availability
/api/mentorship/mentor/sessions
/api/mentorship/mentor/feedbacks
/api/mentorship/hub/stats
/api/organizations
/api/organizations/{organizationSlug}
/api/organizations/{organizationId}/introduction
/api/organizations/{organizationId}/trusted-verifiers
/api/surveys/active?organizationId={organizationId}
/api/surveys/{surveyId}
/api/surveys/{surveyId}/my-submission
/api/education-requests/pending?organizationId={organizationId}
/api/users/{userId}/public-profile
/api/users/me/profile
/api/users/me/organization-member?organizationId={organizationId}
/api/users/me/login-history
/api/users/me/notification-settings
/api/users/me/notifications
/api/users/me/peer-verifications/counterparts?organizationId={organizationId}
/api/users/me/peer-verifications/pending?organizationId={organizationId}
/health
/api/sse/connect
`

type config struct {
	baseURL     string
	email       string
	password    string
	workers     int
	maxRequests uint64
	duration    time.Duration
	timeout     time.Duration
	report      string
	includeSSE  bool
	dryRun      bool
}

type loginEnvelope struct {
	Data struct {
		AccessToken string `json:"accessToken"`
	} `json:"data"`
	Message   string `json:"message"`
	ErrorCode string `json:"errorCode"`
}

type endpointStat struct {
	mu         sync.Mutex
	requests   int64
	successes  int64
	total      time.Duration
	min        time.Duration
	max        time.Duration
	status     map[int]int64
	errors     map[string]int64
	samples    []time.Duration
	seen       int64
	randomizer *rand.Rand
}

type snapshot struct {
	endpoint  string
	requests  int64
	successes int64
	total     time.Duration
	min       time.Duration
	max       time.Duration
	status    map[int]int64
	errors    map[string]int64
	samples   []time.Duration
}

const reservoirSize = 2048

func main() {
	cfg, err := parseConfig()
	if err != nil {
		fatal(err)
	}

	fixtures := defaultFixtures()
	endpoints, err := resolveEndpoints(fixtures, cfg.includeSSE)
	if err != nil {
		fatal(err)
	}
	if cfg.dryRun {
		fmt.Printf("Resolved %d loadable endpoint(s):\n", len(endpoints))
		for _, endpoint := range endpoints {
			fmt.Println(endpoint)
		}
		return
	}

	client := newHTTPClient(cfg)
	token, err := login(client, cfg)
	if err != nil {
		fatal(fmt.Errorf("login failed: %w", err))
	}
	fmt.Printf("Login succeeded. Starting %d workers against %s (%d endpoints, duration=%s).\n",
		cfg.workers, cfg.baseURL, len(endpoints), durationLabel(cfg.duration))

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if cfg.duration > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, cfg.duration)
		defer cancel()
	}

	stats := make(map[string]*endpointStat, len(endpoints))
	for i, endpoint := range endpoints {
		stats[endpoint] = &endpointStat{
			status:     map[int]int64{},
			errors:     map[string]int64{},
			samples:    make([]time.Duration, 0, reservoirSize),
			randomizer: rand.New(rand.NewSource(int64(i + 1))),
		}
	}

	started := time.Now()
	var cursor atomic.Uint64
	var wg sync.WaitGroup
	for worker := 0; worker < cfg.workers; worker++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ctx.Err() == nil {
				position := cursor.Add(1) - 1
				if cfg.maxRequests > 0 && position >= cfg.maxRequests {
					return
				}
				index := int(position) % len(endpoints)
				endpoint := endpoints[index]
				execute(ctx, client, cfg.baseURL, endpoint, token, stats[endpoint])
			}
		}()
	}
	wg.Wait()
	elapsed := time.Since(started)

	snapshots := collectSnapshots(stats)
	printSummary(snapshots, elapsed)
	if err := writeCSV(cfg.report, snapshots, elapsed); err != nil {
		fatal(err)
	}
	fmt.Printf("CSV report: %s\n", cfg.report)
}

func parseConfig() (config, error) {
	var cfg config
	flag.StringVar(&cfg.baseURL, "base-url", "https://alumni-api-hcmus.duckdns.org", "API base URL")
	flag.StringVar(&cfg.email, "email", "test@hcmus.edu.vn", "login email")
	flag.IntVar(&cfg.workers, "workers", 5, "number of concurrent goroutines")
	flag.Uint64Var(&cfg.maxRequests, "max-requests", 0, "stop after this many total requests; 0 means unlimited")
	flag.DurationVar(&cfg.duration, "duration", time.Minute, "test duration; 0 runs until Ctrl+C")
	flag.DurationVar(&cfg.timeout, "timeout", 10*time.Second, "per-request timeout")
	flag.StringVar(&cfg.report, "report", "reports/loadtest.csv", "CSV output path")
	flag.BoolVar(&cfg.includeSSE, "include-sse", false, "include long-lived /api/sse/connect")
	flag.BoolVar(&cfg.dryRun, "dry-run", false, "resolve and print endpoints without login or traffic")
	flag.Parse()

	cfg.baseURL = strings.TrimRight(cfg.baseURL, "/")
	cfg.password = os.Getenv("LOADTEST_PASSWORD")
	if cfg.workers < 1 {
		return cfg, errors.New("workers must be at least 1")
	}
	if cfg.duration < 0 || cfg.timeout <= 0 {
		return cfg, errors.New("duration cannot be negative and timeout must be positive")
	}
	if _, err := url.ParseRequestURI(cfg.baseURL); err != nil {
		return cfg, fmt.Errorf("invalid base URL: %w", err)
	}
	if !cfg.dryRun && cfg.password == "" {
		return cfg, errors.New("LOADTEST_PASSWORD is required")
	}
	return cfg, nil
}

func defaultFixtures() map[string]string {
	now := time.Now()
	return map[string]string{
		"organizationId":       "1",
		"organizationSlug":     "fit-hcmus",
		"userId":               "1",
		"adminUserId":          "11",
		"memberId":             "1",
		"eventId":              "1",
		"ticketCode":           "EVT001-2026-001",
		"categoryId":           "1",
		"topicId":              "1",
		"postId":               "1",
		"fundId":               "1",
		"mentorMemberId":       "2",
		"sessionId":            "1",
		"groupId":              "3",
		"surveyId":             "1",
		"achievementId":        "1",
		"achievementStatus":    "APPROVED",
		"alumniPostId":         "1",
		"alumniPostSlug":       "1",
		"jobId":                "1",
		"learningResourceId":   "1",
		"learningResourceType": "online_course",
		"newsId":               "1",
		"newsSlug":             "alumni-gathering",
		"aiProviderId":         "1",
		"emailTemplateId":      "1",
		"availabilityId":       "1",
		"month":                strconv.Itoa(int(now.Month())),
		"year":                 strconv.Itoa(now.Year()),
	}
}

func resolveEndpoints(fixtures map[string]string, includeSSE bool) ([]string, error) {
	lines := strings.Split(endpointInventory, "\n")
	endpoints := make([]string, 0, len(lines))
	for _, line := range lines {
		endpoint := strings.TrimSpace(line)
		if endpoint == "" || (!includeSSE && endpoint == "/api/sse/connect") {
			continue
		}
		for key, value := range fixtures {
			endpoint = strings.ReplaceAll(endpoint, "{"+key+"}", url.PathEscape(value))
		}
		if strings.Contains(endpoint, "{") {
			return nil, fmt.Errorf("unresolved endpoint fixture: %s", endpoint)
		}
		endpoints = append(endpoints, endpoint)
	}
	return endpoints, nil
}

func newHTTPClient(cfg config) *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConns = cfg.workers * 4
	transport.MaxIdleConnsPerHost = cfg.workers * 2
	transport.MaxConnsPerHost = cfg.workers
	transport.IdleConnTimeout = 90 * time.Second
	return &http.Client{Transport: transport, Timeout: cfg.timeout}
}

func login(client *http.Client, cfg config) (string, error) {
	payload := map[string]any{
		"organizationId": 1,
		"email":          cfg.email,
		"password":       cfg.password,
		"rememberMe":     false,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequest(http.MethodPost, cfg.baseURL+"/api/auth/mobile/login", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "AlumVerse-Go-LoadTest/1.0")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	limited, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", err
	}
	var envelope loginEnvelope
	if err := json.Unmarshal(limited, &envelope); err != nil {
		return "", fmt.Errorf("HTTP %d returned invalid JSON", resp.StatusCode)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("HTTP %d: %s (%s)", resp.StatusCode, envelope.Message, envelope.ErrorCode)
	}
	if envelope.Data.AccessToken == "" {
		return "", errors.New("response has no data.accessToken")
	}
	return envelope.Data.AccessToken, nil
}

func execute(ctx context.Context, client *http.Client, baseURL, endpoint, token string, stat *endpointStat) {
	started := time.Now()
	target := baseURL + endpoint
	if endpoint == "/api/sse/connect" {
		target += "?token=" + url.QueryEscape(token)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		stat.record(0, time.Since(started), err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json, text/csv, text/event-stream")
	req.Header.Set("User-Agent", "AlumVerse-Go-LoadTest/1.0")
	resp, err := client.Do(req)
	latency := time.Since(started)
	if err != nil {
		stat.record(0, latency, err)
		return
	}
	_, readErr := io.Copy(io.Discard, io.LimitReader(resp.Body, 16<<20))
	closeErr := resp.Body.Close()
	if readErr != nil {
		err = readErr
	} else if closeErr != nil {
		err = closeErr
	}
	stat.record(resp.StatusCode, latency, err)
}

func (s *endpointStat) record(status int, latency time.Duration, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.requests++
	s.total += latency
	if s.min == 0 || latency < s.min {
		s.min = latency
	}
	if latency > s.max {
		s.max = latency
	}
	if status >= 200 && status < 300 && err == nil {
		s.successes++
	}
	if status != 0 {
		s.status[status]++
	}
	if err != nil {
		s.errors[normalizeError(err)]++
	}
	s.seen++
	if len(s.samples) < reservoirSize {
		s.samples = append(s.samples, latency)
	} else if position := s.randomizer.Int63n(s.seen); position < reservoirSize {
		s.samples[position] = latency
	}
}

func collectSnapshots(stats map[string]*endpointStat) []snapshot {
	result := make([]snapshot, 0, len(stats))
	for endpoint, stat := range stats {
		stat.mu.Lock()
		item := snapshot{endpoint: endpoint, requests: stat.requests, successes: stat.successes,
			total: stat.total, min: stat.min, max: stat.max, status: cloneMap(stat.status),
			errors: cloneMap(stat.errors), samples: append([]time.Duration(nil), stat.samples...)}
		stat.mu.Unlock()
		result = append(result, item)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].endpoint < result[j].endpoint })
	return result
}

func printSummary(items []snapshot, elapsed time.Duration) {
	var requests, successes int64
	statuses := map[int]int64{}
	var transportErrors int64
	for _, item := range items {
		requests += item.requests
		successes += item.successes
		for status, count := range item.status {
			statuses[status] += count
		}
		for _, count := range item.errors {
			transportErrors += count
		}
	}
	rate := float64(requests) / elapsed.Seconds()
	successRate := percentage(successes, requests)
	fmt.Printf("\nCompleted in %s: requests=%d, success=%d (%.2f%%), RPS=%.2f\n",
		elapsed.Round(time.Millisecond), requests, successes, successRate, rate)
	fmt.Printf("HTTP statuses: %s; transport errors: %d\n", formatCounts(statuses), transportErrors)
	if statuses[http.StatusTooManyRequests] > 0 {
		fmt.Printf("Rate-limited responses (429): %d; production currently allows 100 default-plan requests/minute/IP.\n",
			statuses[http.StatusTooManyRequests])
	}
	fmt.Println("Endpoint details are in the CSV report. Non-2xx responses count as failures.")
}

func writeCSV(path string, items []snapshot, elapsed time.Duration) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("create report directory: %w", err)
	}
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create report: %w", err)
	}
	writer := csv.NewWriter(file)
	defer func() {
		writer.Flush()
		_ = file.Close()
	}()
	if err := writer.Write([]string{"endpoint", "requests", "successes", "success_rate_pct", "rps", "avg_ms", "min_ms", "p50_ms", "p95_ms", "p99_ms", "max_ms", "status_codes", "errors"}); err != nil {
		return err
	}
	for _, item := range items {
		avg := time.Duration(0)
		if item.requests > 0 {
			avg = item.total / time.Duration(item.requests)
		}
		record := []string{
			item.endpoint,
			strconv.FormatInt(item.requests, 10),
			strconv.FormatInt(item.successes, 10),
			fmt.Sprintf("%.2f", percentage(item.successes, item.requests)),
			fmt.Sprintf("%.4f", float64(item.requests)/elapsed.Seconds()),
			milliseconds(avg), milliseconds(item.min), milliseconds(percentile(item.samples, 0.50)),
			milliseconds(percentile(item.samples, 0.95)), milliseconds(percentile(item.samples, 0.99)), milliseconds(item.max),
			formatCounts(item.status), formatCounts(item.errors),
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}
	writer.Flush()
	return writer.Error()
}

func percentile(samples []time.Duration, quantile float64) time.Duration {
	if len(samples) == 0 {
		return 0
	}
	values := append([]time.Duration(nil), samples...)
	sort.Slice(values, func(i, j int) bool { return values[i] < values[j] })
	index := int(quantile*float64(len(values)-1) + 0.5)
	return values[index]
}

func formatCounts[K ~int | ~string](counts map[K]int64) string {
	parts := make([]string, 0, len(counts))
	for key, count := range counts {
		parts = append(parts, fmt.Sprintf("%v:%d", key, count))
	}
	sort.Strings(parts)
	return strings.Join(parts, ";")
}

func cloneMap[K comparable](source map[K]int64) map[K]int64 {
	result := make(map[K]int64, len(source))
	for key, value := range source {
		result[key] = value
	}
	return result
}

func normalizeError(err error) string {
	message := err.Error()
	if len(message) > 180 {
		message = message[:180]
	}
	return strings.ReplaceAll(message, "\n", " ")
}

func percentage(part, total int64) float64 {
	if total == 0 {
		return 0
	}
	return float64(part) * 100 / float64(total)
}

func milliseconds(value time.Duration) string {
	return fmt.Sprintf("%.3f", float64(value)/float64(time.Millisecond))
}

func durationLabel(duration time.Duration) string {
	if duration == 0 {
		return "until interrupted"
	}
	return duration.String()
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "error:", err)
	os.Exit(1)
}
