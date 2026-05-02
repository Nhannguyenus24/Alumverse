# Optimization Guide — Alumniverse

> Tổng hợp các điểm cần tối ưu để cải thiện performance và code quality.  
> Mỗi mục ghi rõ **file**, **vấn đề**, và **hướng xử lý**.

---

## Mục lục

- [BACKEND](#backend)
  - [B1 · Full-table scan với LIKE — ảnh hưởng toàn bộ tính năng tìm kiếm](#b1--full-table-scan-với-like)
  - [B2 · Thiếu index trên Foreign Key và cột lọc](#b2--thiếu-index-trên-foreign-key-và-cột-lọc)
  - [B3 · N+1 Query trong ChatService và MentorService](#b3--n1-query)
  - [B4 · Fire-and-forget .subscribe() không có error boundary](#b4--fire-and-forget-subscribe)
  - [B5 · concatMap xử lý tuần tự thay vì song song](#b5--concatmap-tuần-tự)
  - [B6 · Thiếu transaction cho các thao tác multi-step](#b6--thiếu-transaction)
  - [B7 · findAll() không có pagination](#b7--findall-không-pagination)
  - [B8 · Fetch trùng lặp — findById gọi hai lần](#b8--fetch-trùng-lặp)
  - [B9 · Credentials nhạy cảm hardcode trong application.properties](#b9--credentials-hardcode)
  - [B10 · Connection pool — max-idle-time quá dài](#b10--connection-pool)
- [FRONTEND](#frontend)
  - [F1 · Bundle size — không có code splitting (ĐÃ SỬA)](#f1--bundle-size--đã-sửa)
  - [F2 · React Query staleTime = 0 (ĐÃ SỬA)](#f2--react-query-staletime--đã-sửa)
  - [F3 · Scroll listener không throttle trong Header (ĐÃ SỬA)](#f3--scroll-listener--đã-sửa)
  - [F4 · import * pattern — ngăn tree-shaking](#f4--import--pattern)
  - [F5 · Inline object/function trong JSX props — re-render không cần thiết](#f5--inline-objectfunction-trong-jsx-props)
  - [F6 · Multiple setState trong async function](#f6--multiple-setstate-trong-async)
  - [F7 · Không dùng React Query nhất quán — DonationPage, admin hooks](#f7--thiếu-react-query-nhất-quán)
  - [F8 · Danh sách dài không dùng virtualization](#f8--danh-sách-dài-không-virtualization)
  - [F9 · Table.jsx dùng index làm key](#f9--tablejsx-dùng-index-làm-key)
  - [F10 · Background image auth không được preload](#f10--background-image-không-preload)

---

## BACKEND

### B1 · Full-table scan với LIKE

**Mức độ:** 🔴 Critical  
**Ảnh hưởng:** Tất cả tính năng tìm kiếm sẽ chạy chậm tuyến tính O(n) theo số bản ghi.

Toàn bộ các tính năng search đang dùng `LOWER(col) LIKE LOWER(CONCAT('%', :keyword, '%'))` — dạng wildcard hai đầu khiến PostgreSQL không thể dùng B-tree index, bắt buộc full table scan.

| File | Bảng |
|---|---|
| `article/dao/AlumniPostR2dbcRepository.java:26-29` | `alumni_posts` (title, content) |
| `article/dao/NewsR2dbcRepository.java:26-29` | `news` (title, content) |
| `article/dao/JobR2dbcRepository.java:34-37` | `jobs` (title, description, company_name) |
| `article/dao/LearningResourceR2dbcRepository.java:25-28` | `learning_resources` (title, description) |
| `article/dao/AchievementR2dbcRepository.java:31-34` | `achievements` (title, description) |
| `mentorship/dao/MentorProfileR2dbcRepository.java:32-35` | `mentor_profiles` (job_title, company, bio) |
| `mentorship/dao/MentorExpertiseR2dbcRepository.java:24` | `mentor_expertise` (topic) |
| `fundraising/dao/FundR2dbcRepository.java:25-28` | `funds` (name, description) |
| `event/dao/EventR2dbcRepository.java:36-39` | `events` (title, description) |

**Cách xử lý:**

```sql
-- Tạo GIN index cho PostgreSQL full-text search
CREATE INDEX idx_alumni_posts_fts
  ON alumni_posts
  USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

CREATE INDEX idx_mentor_profiles_fts
  ON mentor_profiles
  USING GIN (to_tsvector('simple',
    coalesce(current_job_title,'') || ' ' ||
    coalesce(current_company,'') || ' ' ||
    coalesce(bio,'')));

-- Tương tự cho các bảng còn lại
```

Sau khi có index, đổi query từ `LIKE` sang `to_tsvector / to_tsquery`:

```sql
-- Thay thế LIKE
WHERE to_tsvector('simple', title || ' ' || content) @@ plainto_tsquery('simple', :keyword)
```

---

### B2 · Thiếu index trên Foreign Key và cột lọc

**Mức độ:** 🔴 Critical  
**Ảnh hưởng:** Mọi JOIN và WHERE trên các cột này đều là full scan.

```sql
-- Chạy một lần để thêm các index còn thiếu
CREATE INDEX idx_org_members_org_id    ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id   ON organization_members(user_id);
CREATE INDEX idx_forum_topics_cat_id   ON forum_topics(category_id);
CREATE INDEX idx_forum_posts_topic_id  ON forum_posts(topic_id);
CREATE INDEX idx_forum_posts_composite ON forum_posts(topic_id, is_banned, is_hidden);
CREATE INDEX idx_alumni_posts_org_hidden ON alumni_posts(organization_id, is_hidden);
CREATE INDEX idx_events_org_published  ON events(organization_id, is_published);
CREATE INDEX idx_jobs_org_active       ON jobs(organization_id, is_active);
CREATE INDEX idx_funds_status          ON funds(status);
CREATE INDEX idx_login_history_user_id ON user_login_history(user_id);
CREATE INDEX idx_audit_log_target      ON admin_audit_logs(target_user_id);
CREATE INDEX idx_audit_log_admin       ON admin_audit_logs(admin_user_id);
```

Xem lại query tại:
- `admin/dao/AdminUserRepository.java:26-34, 96-102`
- `forum/dao/ForumPostRepository.java:20, 46, 128-131`
- `forum/dao/ForumTopicRepository.java:23, 62-69`

---

### B3 · N+1 Query

**Mức độ:** 🟠 High

#### ChatService — buildPrivateChatListItem

`chat/service/ChatService.java:95-170`

```java
// Hiện tại — concatMap gây N+1: mỗi chat group = 3 queries riêng
chatGroupMemberRepository.findByGroupId(groupId)   // query 1
authRepository.findById(peerId)                     // query 2
chatMessageRepository.findLastByGroupId(groupId)    // query 3
```

**Hướng xử lý:** Viết một query JOIN duy nhất lấy đủ thông tin (group, last_message, peer_user) thay vì 3 roundtrips per chat.

#### MentorService — enrichAll

`mentorship/service/MentorService.java:58-71`

```java
// Hiện tại — concatMap: mỗi session query availabilityRepository riêng
.concatMap(s -> availabilityRepository.findById(s.getAvailabilityId()))
```

**Hướng xử lý:** Collect tất cả `availabilityId`, dùng một query `findAllById(ids)` rồi build Map để tra cứu O(1) — tương tự pattern đang làm tốt ở `UserDisplayInfoRepository`.

---

### B4 · Fire-and-forget .subscribe()

**Mức độ:** 🟠 High

Dùng `.subscribe()` bên ngoài reactive chain tạo ra "dangling subscription" — không có cách cancel, không propagate lỗi về request context.

| File | Dòng | Mô tả |
|---|---|---|
| `auth/service/AuthService.java` | ~438 | Ghi login history |
| `forum/service/ForumService.java` | ~190-195 | Tăng view count topic |

**Hướng xử lý — auth:**  
Dùng `subscribeOn(Schedulers.boundedElastic())` và không `.subscribe()` — thay vào đó trả Mono về cho caller hoặc dùng `.then()` chain.

```java
// Thay vì
userLoginHistoryRepository.save(history).subscribeOn(...).subscribe();

// Dùng
return userLoginHistoryRepository.save(history)
    .subscribeOn(Schedulers.boundedElastic())
    .onErrorResume(e -> { log.warn(...); return Mono.empty(); });
// rồi flatMap vào chain chính với .then()
```

**Hướng xử lý — view count:**  
Vì view count không cần đảm bảo tuyệt đối, có thể giữ fire-and-forget nhưng thêm timeout:

```java
forumTopicRepository.incrementViewCount(topicId)
    .timeout(Duration.ofMillis(500))
    .onErrorResume(e -> Mono.empty())
    .subscribe();
```

---

### B5 · concatMap tuần tự

**Mức độ:** 🟡 Medium

`concatMap` xử lý từng phần tử **tuần tự** (chờ cái trước xong mới xử lý cái sau). Nếu các phần tử độc lập với nhau, dùng `flatMap` để xử lý **song song**.

| File | Dòng | Cần đổi |
|---|---|---|
| `chat/service/ChatService.java` | ~102 | `concatMap(group -> buildPrivateChatListItem(...))` |
| `mentorship/service/MentorService.java` | ~61 | `concatMap(s -> availabilityRepository.findById(...))` |

```java
// Nếu thứ tự kết quả không quan trọng
.flatMap(group -> buildPrivateChatListItem(group, memberId), 8) // concurrency = 8

// Nếu cần giữ thứ tự nhưng vẫn muốn parallel
.flatMapSequential(group -> buildPrivateChatListItem(group, memberId), 8)
```

---

### B6 · Thiếu Transaction

**Mức độ:** 🟠 High  
**Ảnh hưởng:** Nếu bước cuối trong chuỗi multi-step thất bại, DB ở trạng thái inconsistent.

R2DBC hỗ trợ `@Transactional` qua `ReactiveTransactionManager` (đã config trong `R2dbcConfig.java`).

| File | Thao tác multi-step |
|---|---|
| `auth/service/AuthService.java:77-91` | Register: check exist → save user → create profile → create org membership |
| `chat/service/ChatService.java:181-208` | Create group: save group → save members |
| `fundraising/service/FundService.java:63-99` | Create fund: validate org → validate status → save fund |

**Cách xử lý:**

```java
// Thêm annotation vào method service
@Transactional
public Mono<Void> register(String email, ...) {
    return authRepository.existsByEmailOrUserName(email, userName)
        .flatMap(exists -> ...)
        // Spring sẽ rollback nếu bất kỳ bước nào throw error
}
```

> **Lưu ý:** Phải dùng `@EnableTransactionManagement` ở config class và đảm bảo `ReactiveTransactionManager` bean đã được inject đúng.

---

### B7 · findAll() không Pagination

**Mức độ:** 🟡 Medium

| File | Dòng | Vấn đề |
|---|---|---|
| `organization/service/OrganizationService.java` | ~45 | `organizationRepository.findAll()` — load toàn bộ orgs |
| `fundraising/service/FundService.java` | ~122-125 | `fundReceivingInfosRepository.findAll().filter(...)` — filter trên memory |

**Cách xử lý:**

```java
// Thêm method pagination vào repository
@Query("SELECT * FROM fund_receiving_infos WHERE is_active = true LIMIT :limit OFFSET :offset")
Flux<FundReceivingInfos> findActiveWithPagination(int limit, long offset);
```

---

### B8 · Fetch trùng lặp

**Mức độ:** 🟡 Medium

Pattern "fetch → update → fetch lại" để trả về entity đã update, trong khi chỉ cần dùng kết quả từ lần update.

| File | Vấn đề |
|---|---|
| `article/usecase/AlumniPostService.java:116-128` | `findById` → `publishAlumniPost` → `findById` lại |
| `article/usecase/JobService.java:87-92, 100-105` | Tương tự |
| `article/usecase/NewsService.java:73-77, 85-89` | Tương tự |

```java
// Thay vì
alumniPostRepository.findById(id)
    .flatMap(existing -> alumniPostRepository.publishAlumniPost(id)
        .then(alumniPostRepository.findById(id)))  // ← query thừa

// Tốt hơn: trả về entity đã update trực tiếp
alumniPostRepository.findById(id)
    .flatMap(post -> {
        post.setIsHidden(false);
        return alumniPostRepository.save(post);  // 1 query thay vì 2
    })
```

---

### B9 · Credentials Hardcode

**Mức độ:** 🔴 Critical — Security  
**File:** `backend/src/main/resources/application.properties`

```properties
# Đang hardcode — phải đổi
jwt.secret=your_secret_key_change_this_in_production...
spring.mail.username=nn5724735@gmail.com
spring.mail.password=bvvqflluvxwzxckc        ← App password Gmail lộ ra git
spring.r2dbc.password=123
```

**Hướng xử lý:**

```properties
# application.properties (commit vào git)
jwt.secret=${JWT_SECRET}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.r2dbc.password=${DB_PASSWORD}
```

Sau đó set environment variables trong CI/CD, Docker compose, hoặc file `.env` (thêm vào `.gitignore`).

---

### B10 · Connection Pool

**Mức độ:** 🟡 Medium  
**File:** `backend/src/main/resources/application.properties:14-21`

```properties
spring.r2dbc.pool.max-idle-time=30m   # ← Quá dài
spring.r2dbc.pool.max-size=20         # ← Có thể tăng nếu load cao
```

**Hướng xử lý:**

```properties
spring.r2dbc.pool.initial-size=5
spring.r2dbc.pool.max-size=30
spring.r2dbc.pool.max-idle-time=10m   # Đổi 30m → 10m tránh stale connection
spring.r2dbc.pool.validation-query=SELECT 1  # Thêm health check
```

---

## FRONTEND

### F1 · Bundle size — ĐÃ SỬA ✅

**File:** `frontend/vite.config.js`

Đã thêm `manualChunks` tách vendor-react, vendor-mui, vendor-charts, vendor-editor, vendor-misc — giảm initial bundle và tăng cache hit rate.

---

### F2 · React Query staleTime — ĐÃ SỬA ✅

**File:** `frontend/src/App.jsx`

Đã thêm `staleTime: 60_000` và `retry: 1` — tránh refetch mỗi lần mount component.

---

### F3 · Scroll listener — ĐÃ SỬA ✅

**File:** `frontend/src/components/Header.jsx`

Đã đổi sang `requestAnimationFrame` throttle + `{ passive: true }` — giảm từ 60+ setState/giây xuống còn max 1 per frame.

---

### F4 · import * Pattern

**Mức độ:** 🟡 Medium  
**Ảnh hưởng:** Bundler không thể tree-shake — kéo vào tất cả export kể cả không dùng.

| File | Dòng |
|---|---|
| `hooks/admin/useAdminForumData.js` | `import * as api from '../../api/adminForumApi'` |
| `hooks/admin/useAdminUsersLocal.js` | `import * as adminUserApi from '../../api/adminUserApi'` |

**Cách xử lý:**

```js
// Thay
import * as api from '../../api/adminForumApi';
api.getForumStatistics()

// Bằng named imports
import { getForumStatistics, getBannedPosts, getPendingReports } from '../../api/adminForumApi';
```

---

### F5 · Inline Object/Function trong JSX Props

**Mức độ:** 🟠 High  
**Ảnh hưởng:** Mỗi render tạo object mới → child nhận prop mới → re-render không cần thiết, kể cả khi data không đổi.

**File:** `frontend/src/components/Header.jsx`

```jsx
// Hiện tại — object tạo lại mỗi render
const navButtonSx = {
  color: headerTextColor,
  fontWeight: 500,
  // ...
};

// Nên đổi: tách phần static ra ngoài component
const NAV_BUTTON_BASE_SX = {
  fontWeight: 500,
  fontSize: '0.9375rem',
  textTransform: 'none',
  px: 1.5,
  transition: 'all 0.3s ease',
};

// Bên trong component, chỉ tính phần dynamic
const navButtonSx = useMemo(() => ({
  ...NAV_BUTTON_BASE_SX,
  color: headerTextColor,
  '&:hover': { backgroundColor: isTransparent ? 'rgba(255,255,255,0.1)' : 'action.hover' },
}), [headerTextColor, isTransparent]);
```

Tương tự với các inline handler trong map:

```jsx
// Hiện tại — tạo function mới mỗi render
onMouseEnter={() => item.children && setHoveredNav(item.label)}

// Nên dùng useCallback với stable reference
// Hoặc chuyển NAV_ITEMS sang component riêng được memo
```

---

### F6 · Multiple setState trong Async

**Mức độ:** 🟠 High  
**Ảnh hưởng:** React 18 auto-batch trong event handler nhưng **KHÔNG** batch trong `Promise.then()` / `async/await` callbacks → mỗi `setState` = một re-render riêng.

**File:** `frontend/src/pages/donation/DonationPage.jsx:189-209`

```js
// Hiện tại — 4 setState riêng biệt trong async function = 4 re-render
setCampaigns(data.items);
setPageCount(data.totalPages);
// ...
setCampaigns([]);
setPageCount(1);
```

**Cách xử lý — dùng `useReducer`:**

```js
const [state, dispatch] = useReducer((s, action) => {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return { ...s, campaigns: action.campaigns, pageCount: action.pageCount };
    case 'LOAD_EMPTY':
      return { ...s, campaigns: [], pageCount: 1 };
  }
}, initialState);

// Trong async — chỉ 1 dispatch = 1 re-render
dispatch({ type: 'LOAD_SUCCESS', campaigns: data.items, pageCount: data.totalPages });
```

**File:** `frontend/src/hooks/useAuth.js:39-43` — tương tự, nhiều `store.setXxx()` liên tiếp trong async.

---

### F7 · Thiếu React Query nhất quán

**Mức độ:** 🟡 Medium  
**Ảnh hưởng:** Các hook dùng `useState + useEffect` không có caching, deduplication, background refresh, hay retry tự động.

**Những nơi dùng pattern thủ công thay vì React Query:**

| File | Pattern hiện tại |
|---|---|
| `pages/donation/DonationPage.jsx:112-220` | 3 `useEffect` riêng fetch statuses, search, campaigns |
| `hooks/admin/useAdminForumData.js` | 9+ cặp `useState/useEffect` |
| `hooks/admin/useAdminUsersLocal.js` | Manual fetch pattern |
| `hooks/admin/useAdminSystemData.js` | Manual fetch pattern |

**Cách xử lý — ví dụ DonationPage:**

```js
// Thay 3 useEffect + 3 useState bằng
const { data: statuses } = useQuery({
  queryKey: ['fund-statuses'],
  queryFn: fundApi.getFundStatuses,
  staleTime: 5 * 60_000,  // statuses ít thay đổi
});

const { data: campaignsPage } = useQuery({
  queryKey: ['campaigns', filters, page],
  queryFn: () => fundApi.getFunds({ ...filters, page }),
  placeholderData: keepPreviousData,  // giữ data cũ khi đổi page
});
```

---

### F8 · Danh sách dài không Virtualization

**Mức độ:** 🟡 Medium  
**Ảnh hưởng:** Render toàn bộ DOM node — với 100+ item sẽ thấy lag rõ ràng khi scroll.

| File | Danh sách |
|---|---|
| `components/Notification.jsx:200-262` | Tất cả notifications |
| `pages/alumni/ForumAlumniThreadPage.jsx:948-960` | Tất cả replies trong thread |

**Cách xử lý — dùng `@tanstack/react-virtual` (đã có trong deps chain) hoặc `react-window`:**

```bash
npm install react-window
```

```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={500}
  itemCount={replies.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ForumReply reply={replies[index]} />
    </div>
  )}
</FixedSizeList>
```

---

### F9 · Table.jsx dùng index làm key

**Mức độ:** 🟡 Medium  
**File:** `frontend/src/components/Table.jsx:67`

```jsx
// Hiện tại — dùng index: React không biết row nào thay đổi khi sort/filter
rows.map((row, rowIndex) => <TableRow key={rowIndex} ...>)

// Đúng hơn — dùng unique id của data
rows.map((row) => <TableRow key={row.id ?? row.userId ?? row.slug} ...>)
```

Dùng index làm key ổn khi list **static và không sort/reorder**, nhưng Table dùng trong toàn bộ admin → data thường xuyên thay đổi.

---

### F10 · Background image không Preload

**Mức độ:** 🟡 Medium  
**File:** `frontend/src/layouts/AuthLayout.jsx:82`  
**File:** `frontend/index.html`

Image `/auth_school.png` được set qua CSS `background-image` — browser không biết cần load trước, gây FOUC (Flash of Unstyled Content) khi user vào trang login.

**Cách xử lý — thêm preload vào `index.html`:**

```html
<head>
  <!-- Thêm dòng này -->
  <link rel="preload" href="/auth_school.png" as="image" />
</head>
```

**Bonus — convert sang WebP để nhỏ hơn 30-50%:**

```bash
# Cài cwebp rồi convert
cwebp -q 85 public/auth_school.png -o public/auth_school.webp
```

```jsx
// AuthLayout.jsx — dùng WebP với fallback
backgroundImage: 'url(/auth_school.webp), url(/auth_school.png)',
```

---

## Tóm tắt ưu tiên

### Backend

| # | Vấn đề | File chính | Ưu tiên |
|---|---|---|---|
| B1 | LIKE full-table scan | 9 repository files | 🔴 Critical |
| B2 | Thiếu DB index | AdminUserRepo, ForumPostRepo... | 🔴 Critical |
| B9 | Credentials hardcode | application.properties | 🔴 Critical |
| B3 | N+1 Query | ChatService, MentorService | 🟠 High |
| B4 | Fire-and-forget subscribe | AuthService, ForumService | 🟠 High |
| B6 | Thiếu @Transactional | AuthService, ChatService, FundService | 🟠 High |
| B5 | concatMap → flatMap | ChatService, MentorService | 🟡 Medium |
| B7 | findAll() không paginate | OrganizationService, FundService | 🟡 Medium |
| B8 | Fetch trùng lặp | AlumniPostService, JobService | 🟡 Medium |
| B10 | Connection pool config | application.properties | 🟡 Medium |

### Frontend

| # | Vấn đề | File chính | Ưu tiên | Trạng thái |
|---|---|---|---|---|
| F1 | Bundle không split | vite.config.js | 🔴 Critical | ✅ Đã sửa |
| F2 | staleTime = 0 | App.jsx | 🟠 High | ✅ Đã sửa |
| F3 | Scroll không throttle | Header.jsx | 🟠 High | ✅ Đã sửa |
| F5 | Inline obj trong JSX | Header.jsx | 🟠 High | Chưa |
| F6 | Multiple setState async | DonationPage, useAuth | 🟠 High | Chưa |
| F7 | Thiếu React Query | DonationPage, admin hooks | 🟡 Medium | Chưa |
| F4 | import * | useAdminForumData | 🟡 Medium | Chưa |
| F8 | Không virtualize list | Notification, ForumThread | 🟡 Medium | Chưa |
| F9 | index làm key | Table.jsx | 🟡 Medium | Chưa |
| F10 | Không preload image | AuthLayout, index.html | 🟡 Medium | Chưa |
