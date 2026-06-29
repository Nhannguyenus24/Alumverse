# Follow-up bảo mật: STAFF org-scoping & Ownership checks

> Tài liệu này ghi lại 2 hạng mục **chưa làm** sau đợt refactor enforce JWT + role
> (xem commit/PR "enforce JWT + role on non-public APIs & stop trusting client-supplied userId").
> Đợt trước đã: bật `@EnableReactiveMethodSecurity`, thêm path gate `/api/admin/** = hasAnyRole(ADMIN,STAFF)`,
> gắn `@PreAuthorize` cho toàn bộ controller, và bỏ việc tin tưởng `userId/memberId` do client gửi
> (Forum, Auth change-email/password, FundDonations).
>
> Hai hạng mục dưới đây **không phải lỗ hổng "USER gọi được API admin"** (đã chặn bằng path gate + `@PreAuthorize`),
> mà là **lỗ hổng phân quyền chi tiết hơn (BOLA / IDOR)**: một principal hợp lệ thao tác lên tài nguyên *không thuộc về mình*.

---

## Bối cảnh chung

Các helper sẵn có ở `shared/utils/SecurityUtils.java` (đều trả `Mono`, dùng trong WebFlux reactive):

| Helper | Ý nghĩa |
|---|---|
| `getCurrentUserId()` | `Mono<Long>` — id user từ JWT subject |
| `getCurrentUserRole()` | `Mono<String>` — `USER` / `STAFF` / `ADMIN` |
| `getCurrentOrganizationId()` | `Mono<Integer>` — org của user từ claim `organizationId` (STAFF luôn có) |
| `resolveOrganizationId(requestedOrgId)` | STAFF → org của chính mình (bỏ qua requested); ADMIN → requested (hoặc empty = all) |

Lỗi nên ném: `ApplicationException(ErrorCode.FORBIDDEN)` (đã có sẵn, HTTP 403).

---

## Hạng mục 1 — STAFF org-scoping cho `AdminOrganizationController`

### Vấn đề
`AdminOrganizationController` (`/api/admin/organizations`) đã được gate `hasAnyRole('ADMIN','STAFF')`, nhưng **các endpoint nhận `{organizationId}` trong path KHÔNG kiểm tra org đó có thuộc STAFF hay không**. Hậu quả: STAFF của org A có thể đọc/sửa cấu hình, programs, majors, introduction, feature-config… của org B (BOLA).

Các endpoint org-scoped cần bảo vệ (mọi method có path `/{organizationId}/...`), ví dụ:
- `GET/PUT /{organizationId}/introduction`
- `GET/POST/PUT/DELETE /{organizationId}/programs`
- `GET/POST/PUT/DELETE /{organizationId}/majors`
- `GET/PUT /{organizationId}/features-config`, `.../site-identity`, `.../brand`, `.../features`, `.../features/{featureName}`, `.../privacy`
- `PATCH /{organizationId}/features-config/features/{featureName}/toggle`
- `GET /{organizationId}` (xem chi tiết 1 org)

> Lưu ý: các endpoint **ADMIN-only** đã gắn `@PreAuthorize("hasRole('ADMIN')")` ở đợt trước (list-all, create, update-org, delete-org, feedback-statistics) — STAFF vốn đã không vào được, **không cần** org-scoping ở các endpoint đó.
>
> Endpoint `GET/PATCH /feedbacks*` dùng `organizationId` là **query param** (không phải path) → áp dụng `resolveOrganizationId(...)` thay vì so khớp path (xem cách 2).

### Hướng làm (khuyến nghị): một guard tập trung
Vì có ~25 endpoint cùng pattern `{organizationId}`, không nên rải `if` khắp nơi. Tạo một helper dùng chung trong `SecurityUtils` (hoặc một `OrganizationAccessService` mới, theo mẫu `MentorshipAccessService`):

```java
// SecurityUtils.java
/**
 * Đảm bảo current user được phép thao tác trên organizationId này:
 * - ADMIN: cho phép mọi org.
 * - STAFF: chỉ cho phép đúng org của mình (claim organizationId trong JWT).
 * Ném FORBIDDEN nếu vi phạm.
 */
public static Mono<Void> requireOrganizationAccess(Integer organizationId) {
    return getCurrentUserRole().flatMap(role -> {
        if ("ADMIN".equals(role)) {
            return Mono.empty();
        }
        return getCurrentOrganizationId()
                .filter(ownOrg -> ownOrg.equals(organizationId))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN)))
                .then();
    });
}
```

Áp dụng ở đầu mỗi endpoint org-scoped trong controller (hoặc service):
```java
@PutMapping("/{organizationId}/introduction")
public Mono<ResponseEntity<ApiResponse<OrganizationIntroductionResponse>>> upsertIntroduction(
        @PathVariable Integer organizationId,
        @Valid @RequestBody UpsertIntroductionRequest request) {
    return SecurityUtils.requireOrganizationAccess(organizationId)
            .then(organizationService.upsertIntroduction(organizationId, request))
            .map(res -> ResponseEntity.ok(new ApiResponse<>("...", res)));
}
```

### Cách 2 (cho endpoint dùng query-param org): tái dùng `resolveOrganizationId`
Với `getSchoolFeedbacks(@RequestParam Integer organizationId, ...)`: thay vì nhận thẳng, ép qua `resolveOrganizationId(organizationId)` — STAFF sẽ luôn bị ghim về org của mình, ADMIN giữ nguyên. Đây là pattern đã dùng ở `AdminArticleController`, `AdminEventController`, `AdminMentorshipController`.

### Kiểm thử (acceptance)
- STAFF org A gọi `PUT /api/admin/organizations/{B}/programs` → **403**.
- STAFF org A gọi `.../{A}/programs` → **200**.
- ADMIN gọi với org bất kỳ → **200**.
- Viết unit test cho `requireOrganizationAccess` (3 nhánh: ADMIN, STAFF đúng org, STAFF sai org) + 1–2 controller test với `@WithMockUser`/JWT giả.

### Rủi ro / cần lưu ý
- Phải rà **mọi** endpoint `{organizationId}` — bỏ sót 1 cái là vẫn còn lỗ hổng. Có thể viết một ArchUnit/test liệt kê để chống hồi quy.
- Một số endpoint hiện là `@PublicEndpoint`? (Không — chúng nằm trong `/api/admin/**`, không public.) Vẫn nên double-check.

---

## Hạng mục 2 — Ownership checks (IDOR)

Các endpoint dưới đây đã yêu cầu JWT nhưng **không kiểm tra caller có sở hữu tài nguyên** → user bất kỳ có thể thao tác lên tài nguyên của người khác nếu biết id/mã.

### 2.1 Huỷ vé sự kiện — `EventController.cancelTicket`
- Endpoint: `POST /api/events/tickets/{ticketCode}/cancel` → `EventService.cancelTicket(String ticketCode, String reason)` (`EventService.java:516`).
- Vấn đề: chỉ cần biết `ticketCode` là huỷ được vé của bất kỳ ai. Hiện không đối chiếu chủ vé với `getCurrentUserId()`.
- Hướng làm: trong `cancelTicket`, sau khi `findTicketByCode`, so khớp chủ vé (cột owner/user id của ticket) với `SecurityUtils.getCurrentUserId()`; nếu khác → `FORBIDDEN`. (Cho phép STAFF/ADMIN của org sự kiện huỷ hộ nếu nghiệp vụ cần — quyết định rõ trước khi code.)

```java
public Mono<EventTicket> cancelTicket(String ticketCode, String reason) {
    return SecurityUtils.getCurrentUserId().flatMap(currentUserId ->
        eventRepository.findTicketByCode(ticketCode)
            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND)))
            .flatMap(ticket -> {
                // EventTicket.memberId (Long) là chủ vé — theo quy ước memberId == userId của hệ thống
                if (ticket.getMemberId() == null || !ticket.getMemberId().equals(currentUserId)) {
                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN));
                }
                return eventRepository.cancelTicket(ticket.getId(), reason.trim());
            }));
}
```

### 2.2 Xem vé theo mã — `EventController.getTicketByCode`
- Endpoint: `GET /api/events/tickets/code/{ticketCode}` → `EventService.getTicketByCode` (`EventService.java:530`).
- Vấn đề: lộ chi tiết vé (tên, email, sự kiện…) cho bất kỳ ai biết mã.
- Hướng làm: hoặc kiểm tra ownership như 2.1, hoặc cho phép cả STAFF/ADMIN org sự kiện. Cân nhắc nghiệp vụ: nếu mã vé dùng để check-in/tra cứu công khai có chủ đích thì giữ nguyên — **cần xác nhận với product** trước khi siết.

### 2.3 Sửa/Xoá bài forum — `ForumService.updatePost` / `deletePost`
- Endpoint: `PUT /api/forum/post/{id}` (`ForumController` → `ForumService.updatePost`, `ForumService.java:323`), `DELETE /api/forum/post/{id}` (`ForumService.deletePost`, `:339`).
- Vấn đề: bất kỳ user đăng nhập nào cũng sửa/xoá được bài của người khác (chỉ cần `id`). Hiện không so `authorMemberId` với caller.
- Hướng làm: truyền `currentUserId` (giống pattern đã làm cho `createPost`/`reactToPost` ở đợt trước — controller gọi `SecurityUtils.getCurrentUserId()` rồi truyền xuống), trong service so `post.getAuthorMemberId()` với id đó; khác → `FORBIDDEN`. Nên cho phép **STAFF/ADMIN** sửa/xoá để phục vụ kiểm duyệt (đối chiếu `getCurrentUserRole()`), vì đã có sẵn endpoint admin forum.

```java
public Mono<ForumPostDTO> updatePost(Integer id, UpdateForumPostRequest request, Integer currentUserId, String role) {
    return forumPostRepository.findById(id)
        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND)))
        .flatMap(post -> {
            boolean isOwner = post.getAuthorMemberId() != null && post.getAuthorMemberId().equals(currentUserId);
            boolean isModerator = "STAFF".equals(role) || "ADMIN".equals(role);
            if (!isOwner && !isModerator) {
                return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN));
            }
            post.setContent(request.getContent());
            return forumPostRepository.save(post);
        })
        .map(this::convertToPostDTO);
}
```
> Nhắc: nhớ cập nhật `ForumServiceTest` khi đổi chữ ký (giống đợt trước với `createPost`).

### Kiểm thử (acceptance)
- User B huỷ vé / sửa-xoá bài của user A → **403**; chính chủ → **200**.
- STAFF/ADMIN (nếu nghiệp vụ cho phép kiểm duyệt) sửa/xoá bài người khác → **200**.

---

## Thứ tự ưu tiên đề xuất
1. **2.3 Forum sửa/xoá bài** — dễ bị lạm dụng nhất (ai cũng đoán được `id` tuần tự), pattern truyền `currentUserId` đã có sẵn.
2. **2.1 Huỷ vé** — ảnh hưởng trực tiếp tới dữ liệu người dùng.
3. **Hạng mục 1 — STAFF org-scoping** — phạm vi rộng (nhiều endpoint), nên làm một lần bằng helper tập trung + test chống hồi quy.
4. **2.2 Xem vé theo mã** — cần xác nhận nghiệp vụ trước (có thể là chủ đích public).

---

## Hạng mục 3 — JWT verification hardening

### Đã làm trong đợt này
- **Regression guard cho endpoint public** — `PublicEndpointGuardTest` (`src/test/java/com/service/backend/config/`):
  - Quét mọi `@RestController`, chốt danh sách endpoint `@PublicEndpoint` thành allowlist. Thêm/bớt `@PublicEndpoint` (hoặc gắn nhầm class-level) sẽ **fail test** → buộc review bảo mật rồi mới cập nhật allowlist.
  - Invariant phụ: **không endpoint nào dưới `/api/admin` được phép public**.
  - Nhắc: mọi endpoint không `@PublicEndpoint` đã mặc định bắt buộc JWT nhờ `SecurityConfig.anyExchange().authenticated()` — nên rủi ro hồi quy thực sự là *vô tình mở public*, đúng thứ test này canh.
- **Thu hồi access token khi logout** — `JwtUtils.revokeToken()` + blacklist Caffeine (`revokedTokenCache`, TTL = `jwt.expiration_access` = 15 phút). `validateToken()` chặn token đã thu hồi trước khi parse. `AuthController.logout()` đọc `Authorization: Bearer` và revoke. Trước đây logout chỉ xóa cookie refresh, access token vẫn sống tới hết hạn.

### Còn lại (đề xuất)
- **Issuer / audience claims**: hiện token không set `iss`/`aud`. Nên set khi generate (`JwtUtils.generateAccessToken`) và validate trong `parseAndVerify` để chống token phát hành từ hệ khác dùng chung secret.
- **Refresh token rotation + revocation**: refresh token hiện không bị vô hiệu khi logout/đổi mật khẩu (chỉ xóa cookie phía client). Cân nhắc lưu jti/hash refresh token ở DB/Redis, xoay vòng mỗi lần refresh, và revoke khi logout/đổi mật khẩu.
- **Revoke theo `jti` thay vì full-token string**: thêm claim `jti` khi generate; blacklist theo `jti` gọn hơn là theo cả chuỗi token. Đồng thời nên revoke **tất cả** token của user khi đổi mật khẩu/ban (cần lưu danh sách jti theo userId hoặc dùng "tokens-valid-after" timestamp).
- **Secret strength ở production**: `jwt.secret` trong `application.properties`/`application-prod.properties` đang là placeholder; bắt buộc cấu hình qua biến môi trường, đủ ≥ 256-bit cho HS256.
- **Bù blacklist khi scale nhiều instance**: `revokedTokenCache` là in-memory mỗi instance — token revoke ở instance A vẫn hợp lệ ở instance B cho tới khi hết hạn (tối đa 15 phút). Nếu chạy nhiều pod, chuyển blacklist sang Redis dùng chung.

### Kiểm thử (acceptance) cho phần đã làm
- Gọi 1 API protected với access token → 200; gọi `POST /api/auth/logout` kèm token đó → 200; gọi lại API protected với **cùng** token → **401** (`INVALID_TOKEN`, message "Token has been revoked").
- Thêm `@PublicEndpoint` vào một method bất kỳ → `PublicEndpointGuardTest` fail (đúng kỳ vọng).

---

## Ngoài phạm vi (ghi nhận thêm)
- 2 endpoint search trong chat (`ConnectionSearchController`, `NetworkMemberSearchController`) không dùng `getCurrentUserId()` — có vẻ cố ý (directory search), chưa cần đổi.
- Cân nhắc thêm `verification_level` vào JWT để có thể enforce "alumni" bằng `@PreAuthorize` thay vì query DB ở service layer (hiện `MentorshipAccessService.requireMinVerificationLevel` query DB mỗi request).
