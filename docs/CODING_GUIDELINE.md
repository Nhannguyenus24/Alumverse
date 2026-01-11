# Coding Guidelines for Student Alumni System

This document establishes the fundamental coding principles and best practices for all developers working on the Student Alumni System project. Following these guidelines ensures code quality, maintainability, security, and consistency across the entire codebase.

---

## Table of Contents

1. [Input & Boundary Validation](#1-input--boundary-validation)
2. [Time & Number Handling](#2-time--number-handling)
3. [Naming Conventions](#3-naming-conventions)
4. [Functions & Methods](#4-functions--methods)
5. [State & Side Effects](#5-state--side-effects)
6. [Error Handling](#6-error-handling)
7. [Dependency & Architecture](#7-dependency--architecture)
8. [Async & Concurrency](#8-async--concurrency)
9. [Logging](#9-logging)
10. [Code Comments](#10-code-comments)

---

## 1. Input & Boundary Validation

**Why it matters:** Approximately 80% of security vulnerabilities and data corruption issues stem from insufficient input validation. Never trust any external data source.

### 1.1. Never Trust Any Input

**Rule:** All external inputs must be validated at system boundaries before being processed by core business logic.

**Input sources that require validation:**
- User input (forms, query parameters, path parameters)
- External API responses
- Database query results
- Environment variables
- Configuration files
- File uploads
- Third-party service data

**Best Practice:** Validate at the boundary layer, not in core logic

**Example:**

```javascript
// GOOD: Validate at the boundary (Controller/API layer)
async function createUserEndpoint(req, res) {
  if (!isValidEmail(req.body.email)) {
    throw new ValidationError("Invalid email format");
  }
  if (!req.body.name || req.body.name.length < 2) {
    throw new ValidationError("Name must be at least 2 characters");
  }
  
  // Core logic can now safely assume valid data
  const user = await userService.createUser(req.body);
  res.json(user);
}

// BAD: Validating inside core logic
async function createUser(data) {
  // Don't do this - validation should happen at boundary
  if (!isValidEmail(data.email)) throw Error();

// core
sendEmail(email);

✅ 1.2. Null / undefined phải được xử lý sớm

Guard clause

Không để null “chạy sâu” vào logic

if (user == null) return;

2️⃣ Luật về Time & Number
✅ 2.1. Thời gian luôn có đơn vị

❌ timestamp
✅ timestampSeconds, timestampMs

70% bug production liên quan time / timezone

✅ 2.2. Không so sánh số “ma thuật”

❌

if (status === 3)


✅

if (status === STATUS.APPROVED)

3️⃣ Luật về Naming (cực kỳ quan trọng)
✅ 3.1. Tên phải trả lời được câu hỏi

“Thằng này dùng để làm gì?”

❌ data, result, info
✅ userProfile, bidAmount, authToken

✅ 3.2. Boolean phải có dạng câu hỏi

❌ active
✅ isActive, hasPermission, canBid

4️⃣ Luật về Function & Method
✅ 4.1. Một function chỉ làm một việc

Nếu tên function có chữ and → sai

❌

createUserAndSendEmail()

✅ 4.2. Function không nên dài quá 20–30 dòng

Nếu dài:

tách

đặt tên tốt

5️⃣ Luật về State & Side Effects
✅ 5.1. Tránh side effect ngầm

❌

function calculate() {
  total += 10;
}


✅

function calculate(total) {
  return total + 10;
}

✅ 5.2. Immutable > Mutable

Đặc biệt trong frontend / reactive

const newList = [...oldList, item];

6️⃣ Luật về Error Handling
✅ 6.1. Đừng nuốt lỗi

❌

catch (e) {}


✅

catch (e) {
  logger.error(e);
  throw e;
}

✅ 6.2. Throw lỗi có ý nghĩa

❌ throw new Error("Error")
✅ throw new AuthExpiredError()

7️⃣ Luật về Dependency & Architecture
✅ 7.1. Phụ thuộc vào abstraction, không phải implementation
constructor(userRepo: UserRepository)

✅ 7.2. Không import chéo tầng

Controller ❌ gọi DB

Service ❌ biết HTTP

8️⃣ Luật về Async / Concurrency
✅ 8.1. Không block event loop

WebFlux / Node → ❌ sleep / blocking IO

✅ 8.2. Luôn xử lý promise/mono

❌ quên await
❌ quên subscribe

9️⃣ Luật về Logging
✅ 9.1. Log phải có ngữ cảnh

❌

console.log("error");


✅

logger.error("Bid failed", { userId, productId });

🔟 Luật về Comment
✅ 10.1. Comment WHY, không comment WHAT

❌

// increment i
i++;


✅

// Retry once because payment gateway is flaky