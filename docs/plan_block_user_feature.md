# Plan: Block User Feature

## Overview

User A can block User B. The block is **unidirectional** (A blocks B — one row in `user_blocks`).

**Policy (Direction B):** Only **one block relationship** may exist between any two members. If A has already blocked B, B **cannot** block A in return.

### Behavior when A blocks B

| Party | See conversation in chat list | Read message history | Send messages |
|-------|------------------------------|---------------------|---------------|
| A (blocker) | ✅ Yes | ✅ Yes | ❌ No |
| B (blocked) | ✅ Yes | ✅ Yes | ❌ No |

> **UX rationale:** Do **not** remove B from `chat_group_members`. If B's membership is deleted silently, the conversation disappears from B's chat list without explanation — poor UX. Both members stay in the group; sending is blocked at the API layer.

### Behavior when A unblocks B

Both parties return to normal: can see, read, and send messages. Full message history is preserved.

---

## 1. Database Changes

### 1.1 New table: `user_blocks`

```sql
CREATE TABLE "user_blocks" (
  "id" BIGSERIAL PRIMARY KEY,
  "blocker_member_id" integer NOT NULL,
  "blocked_member_id" integer NOT NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX ON "user_blocks" ("blocker_member_id", "blocked_member_id");

ALTER TABLE "user_blocks"
  ADD FOREIGN KEY ("blocker_member_id") REFERENCES "organization_members" ("user_id");

ALTER TABLE "user_blocks"
  ADD FOREIGN KEY ("blocked_member_id") REFERENCES "organization_members" ("user_id");
```

> **Note:** `member_id` here is `organization_members.user_id` (consistent with all other chat tables).

### 1.2 No changes to other chat tables

- `chat_group_members`: **no row deletions/insertions** on block/unblock.
- `chat_conversation_requests`: no status change needed.

---

## 2. Block Flow (A blocks B)

**Precondition:** A and B must be members of the same organization.

### Step 1 — Guard checks
- A cannot block themselves.
- A cannot block someone they have already blocked → `409 Conflict`.
- If **any** block already exists between A and B (e.g. A already blocked B, or reverse attempt) → B cannot create a new block → `403`.
- A must be a valid `organization_member`.

### Step 2 — Insert into `user_blocks`
```sql
INSERT INTO user_blocks (blocker_member_id, blocked_member_id)
VALUES (:memberIdA, :memberIdB);
```

### Step 3 — No `chat_group_members` changes

Membership is preserved. Block effect is enforced in `sendMessage()` and conversation-request guards.

---

## 3. Unblock Flow (A unblocks B)

### Step 1 — Guard checks
- A must have an active block on B (record exists in `user_blocks`).

### Step 2 — Delete from `user_blocks`
```sql
DELETE FROM user_blocks
WHERE blocker_member_id = :memberIdA
  AND blocked_member_id = :memberIdB;
```

### Step 3 — No `chat_group_members` changes

Both members were never removed; no re-add needed.

---

## 4. Backend Implementation (Java / Spring WebFlux + R2DBC)

### 4.1 Key files

```
backend/
└── src/main/java/com/service/backend/
    ├── shared/entity/UserBlock.java
    ├── chat/dao/UserBlockRepository.java
    ├── chat/service/UserBlockService.java
    ├── chat/controller/UserBlockController.java
    └── chat/dto/
        ├── BlockStatusResponse.java
        ├── BlockPairFlags.java
        └── BlockedMemberItemResponse.java
```

### 4.2 REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat/blocks/{targetMemberId}` | A blocks B |
| `DELETE` | `/api/chat/blocks/{targetMemberId}` | A unblocks B |
| `GET` | `/api/chat/blocks` | List all members A has blocked |
| `GET` | `/api/chat/blocks/{targetMemberId}` | Check if A has blocked B |

### 4.3 Private chat list — block flags

`GET /api/chat/private/list` includes per-item block state:

| Field | Meaning |
|-------|---------|
| `blockedByMe` | Current user blocked the peer |
| `blockedByPeer` | Peer blocked the current user |

Frontend uses these fields to disable input and show banners — no extra round-trip per conversation.

### 4.4 Send Message Guard

Block guard applies to **PRIVATE chats only**. Multi-member **GROUP** chats allow sending even when block relationships exist between members in the same group.

In `ChatService.sendMessage()`:

| Chat type | Block guard |
|-----------|-------------|
| `PRIVATE` | Enforce `assertSenderCanSendMessage()` before insert |
| `GROUP`   | Skip block guard — allow send in both directions |

**PRIVATE guard** checks before persisting:

1. Sender has blocked any member in this private chat, **or**
2. Any member in this private chat has blocked the sender

```sql
-- Sender blocked someone in group
SELECT 1 FROM user_blocks ub
JOIN chat_group_members cgm ON cgm.member_id = ub.blocked_member_id
WHERE ub.blocker_member_id = :senderMemberId
  AND cgm.group_id = :groupId
LIMIT 1;

-- Someone in group blocked sender
SELECT 1 FROM user_blocks ub
JOIN chat_group_members cgm ON cgm.member_id = ub.blocker_member_id
WHERE ub.blocked_member_id = :senderMemberId
  AND cgm.group_id = :groupId
LIMIT 1;
```

→ `403 USER_COMMUNICATION_BLOCKED` (PRIVATE only)

### 4.5 Group chat — blocked members context API

When the user opens a **GROUP** chat, frontend calls:

`GET /api/chat/groups/{groupId}/blocked-members-context`

Returns members **blocked by the current user** who are **still in the group**, plus the current user's role (`OWNER` | `MEMBER`):

```sql
SELECT ub.blocked_member_id, gp.full_name
FROM user_blocks ub
INNER JOIN chat_group_members cgm
    ON cgm.member_id = ub.blocked_member_id
   AND cgm.group_id = :groupId
LEFT JOIN global_profiles gp ON gp.user_id = ub.blocked_member_id
WHERE ub.blocker_member_id = :currentMemberId
ORDER BY ub.created_at DESC
```

Frontend shows an **info banner** (does not disable input):

- Lists blocked member names (e.g. *"A, B và 1 người khác"*)
- **Owner** (`role === 'OWNER'`): suggests kick or leave via member drawer (⋯)
- **Member**: suggests leave via member drawer
- Button opens `GroupMembersDrawer`

Invalidate React Query key `['chat', 'group-blocked-members']` after block/unblock/kick/leave — no window-focus refetch.

**Accepted (phase 1):** Messages from blocked users still appear in group history; no per-message filtering yet.

### 4.6 Network search exclusion

Members with any active block between them are excluded from network directory search (bidirectional `NOT EXISTS` on `user_blocks`).

### 4.7 Transaction handling

Block/unblock only writes to `user_blocks` (single-table operation). `@Transactional` still wraps the service method for consistency.

---

## 5. Frontend Implementation (React)

### 5.1 UI entry points

- **Network member card** (`⋯` menu): Block user
- **Chat conversation header** (private chat `⋯` menu): Block / Unblock

### 5.2 Chat UI behavior

**A (blocker) — `blockedByMe: true`:**
- Conversation remains in chat list
- Can read message history
- Input disabled; banner: *"Bạn đã chặn [name]. Bạn không thể gửi tin nhắn cho họ."* + **Unblock** button

**B (blocked) — `blockedByPeer: true`:**
- Conversation remains in chat list
- Can read message history
- Input disabled; banner: *"Bạn không thể nhắn tin cho [name]."*
- No block-back menu (Direction B policy)

**After unblock:**
- Input re-enabled; banners removed; messaging resumes

**GROUP chat — user has blocked member(s) still in the group:**
- Input **enabled**; user can send messages in the group
- Info banner lists blocked names + action hint (kick/leave via member drawer)
- Kick removes member from group; block row in `user_blocks` remains (PRIVATE chat still blocked)
- Invalidate blocked-members query after block/unblock/kick/leave

### 5.3 API calls

```
blockUser(targetMemberId)      → POST  /api/chat/blocks/:targetMemberId
unblockUser(targetMemberId)    → DELETE /api/chat/blocks/:targetMemberId
getBlockStatus(targetMemberId) → GET   /api/chat/blocks/:targetMemberId
getBlockList()                 → GET   /api/chat/blocks
listPrivateChats()             → GET   /api/chat/private/list  (includes blockedByMe / blockedByPeer)
getGroupBlockedMembersContext  → GET   /api/chat/groups/:groupId/blocked-members-context
```

---

## 6. Edge Cases

| Case | Handling |
|------|----------|
| A blocks B but no conversation exists yet | Insert `user_blocks` only |
| A tries conversation request while block active | `403` at API |
| B tries conversation request while A blocked B | `403` at API |
| B tries to block A after A blocked B | `403 USER_BLOCK_RELATIONSHIP_EXISTS` |
| A blocks B multiple times | `409 USER_ALREADY_BLOCKED` |
| A unblocks B | Delete row; messaging restored immediately |
| Network search | Blocked pairs excluded bidirectionally |
| A blocks B, both in same GROUP chat | GROUP: can still send; info banner shown. PRIVATE: send blocked |
| Owner kicks blocked member from GROUP | Member leaves group; banner updates; block on PRIVATE unchanged |
| Multiple blocked members in GROUP | Banner: *"A, B và N người khác"* |

---

## 7. Out of Scope

- Admin-level forced block
- Block expiry / temporary blocks
- Notification suppression for blocked users
- Hiding blocked users' messages in GROUP chat history (phase 2)
