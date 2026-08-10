# News published-list redesign

## Scope

This change applies only to the public news listing flow:

- Backend: `GET /api/articles/news/published`
- Frontend: the public activities news page and the homepage consumer of published news
- The news detail endpoints must keep returning the complete article content.

Other article channels (events, jobs, learning resources, achievements, and alumni posts) are out of scope.

## Problems being fixed

1. The activities news page currently requests up to 200 records and performs filtering, sorting, featured selection, and pagination in the browser.
2. The list endpoint selects and returns the complete rich-text `content` for every record, although cards only display a three-line preview.
3. The backend accepts an effectively unbounded `limit`.

## Required behavior

### Featured news

- Featured news is one fixed record per organization: the newest published news by `created_at DESC`.
- It is independent of list search, filters, sorting, and page changes.
- It must satisfy:
  - `organization_id = :organizationId`
  - `is_hidden = false`
- The featured record is returned separately from the paginated `items` collection.
- The featured record must be excluded from `items` so it is not displayed twice.

### Paginated items

- Default request: page `0`, limit `15`.
- `page` remains zero-based.
- Backend validation must enforce `1 <= limit <= 15`.
- `items` contains at most 15 non-featured records.
- `totalItem`, `totalPage`, `hasNext`, and `hasPrevious` describe only the filtered, non-featured item collection.
- Default ordering is newest first.

### Search and filters

The published endpoint owns filtering before pagination. When a parameter is absent, that filter is not applied.

- Keyword search: case-insensitive search against the complete database `title` and `content`, not the truncated preview.
- Topic filter: preserve the frontend's current multi-topic behavior.
- Date range: preserve the current inclusive from/to-day behavior.
- Sort: support newest and oldest.
- All queries remain scoped to the requested/resolved organization and published records only.
- Featured remains visible and unchanged even when it does not match the active filters.

The frontend must stop filtering or paginating the fetched news array locally. It should pass the current filter state to the endpoint, debounce text search, and render pagination from backend metadata.

## Response contract

The data payload should retain the existing pagination fields and add a separate featured record:

```json
{
  "featured": {
    "id": 1,
    "title": "...",
    "content": "short plain-text preview"
  },
  "items": [],
  "currentPage": 0,
  "pageSize": 15,
  "totalPage": 0,
  "totalItem": 0,
  "hasNext": false,
  "hasPrevious": false
}
```

The exact response DTO may extend or replace the current generic pagination DTO, but it must be a concrete class.

## Content projection

- Keep the JSON field name `content` for compatibility.
- For both `featured` and `items`, `content` is a plain-text preview capped at approximately 260 characters; the frontend retains its three-line CSS clamp.
- Keep search, filters, sorting, counting, and pagination in the database, then load complete rich-text
  content only for the single featured record and the current page (at most 15 items).
- Convert those bounded results to plain text and truncate them in the backend with an HTML parser;
  do not implement HTML parsing through nested SQL regular expressions.
- Use a concrete projection class, not an interface projection. This project uses Spring WebFlux with Spring Data R2DBC.
- Do not reuse or weaken the detail response: fetching news by ID or slug must still return the complete rich-text `content`.

## Frontend compatibility

- `ActivitiesNewsPage` renders `featured` separately and renders the backend `items` directly, 15 per page.
- Changing filters resets the list page to zero.
- The homepage must continue showing the newest news including the featured record; adapt its hook consumption to the new response without introducing a 200-record request.
- The Flutter news consumer must parse the separate `featured` record and expose it first, followed by `items`, so its existing featured/list UI remains compatible.
- Remove the news page's dependency on `ARTICLE_FETCH_LIMIT = 200`. Do not change the behavior of other article-channel pages that still use that constant.

## Cache

- Keep the existing five-minute Caffeine cache.
- Cache keys must include organization, page, limit, keyword, topics, date range, and sort so filtered results cannot collide.
- Existing news create/update/delete/publish/hide flows must continue clearing the news cache.

## Verification

Backend tests should cover:

- Default and maximum page size of 15, and rejection above 15.
- Fixed newest featured record and its exclusion from `items`.
- Search/filter-before-pagination behavior and correct filtered totals.
- Featured independence from filters.
- Preview content is bounded/plain text while detail content remains complete.
- Organization and published visibility constraints.

Frontend tests or equivalent verification should cover:

- No news request uses limit 200.
- Page/filter changes generate the expected backend request parameters.
- Featured stays fixed while changing pages and filters.
- Backend pagination metadata drives the pagination component.
- Homepage still includes the newest featured news.
