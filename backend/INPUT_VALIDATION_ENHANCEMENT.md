# Input Validation Enhancement Guide

## Overview
Comprehensive validation strategy for all DTOs to protect server from malicious/invalid input.

## Current Status

**Total DTOs**: ~110  
**With validation**: ~30-40% (estimated)  
**Missing validation**: ~60-70% (need enhancement)

---

## Validation Rules by Field Type

### 1. Text Fields (@NotBlank, @Size)

```java
@NotBlank(message = "Field is required")
@Size(min = 2, max = 100, message = "Field must be 2-100 characters")
private String name;
```

**Apply to**:
- Names (fullName, title, groupName)
- Text inputs (bio, description, address)
- Email, username

**Size Limits**:
- Names: 2-100 chars
- Titles/descriptions: 3-500 chars
- URLs: 5-2000 chars
- Bio/bio fields: 0-1000 chars (optional)

---

### 2. Numbers (@Min, @Max, @NotNull)

```java
@NotNull(message = "ID is required")
@Min(value = 1, message = "ID must be positive")
private Integer id;

@Min(value = 0, message = "Amount must be >= 0")
@Max(value = 1000000, message = "Amount too large")
private BigDecimal amount;
```

**Apply to**:
- IDs (organizationId, userId, etc)
- Amounts (prices, donations)
- Quantities (page size, limits)
- Years (birth year, graduation year)

---

### 3. Email (@Email)

```java
@NotBlank
@Email(message = "Email must be valid")
@Size(max = 255, message = "Email too long")
private String email;
```

**Apply to**: Any email field

---

### 4. URLs (@Pattern or custom validator)

```java
@NotBlank
@Pattern(regexp = "^https?://.*", message = "Must be valid URL")
@Size(max = 2000)
private String url;
```

**Or use InputSanitizer**:
```java
if (!InputSanitizer.isValidUrl(url)) {
    throw new ValidationException("Invalid URL");
}
```

---

### 5. Phone (@Pattern)

```java
@NotBlank
@Pattern(regexp = "^0[35789]\\d{8}$", message = "Invalid Vietnamese phone")
private String phone;
```

---

### 6. Date (@PastOrPresent, @FutureOrPresent)

```java
@PastOrPresent(message = "Date of birth must be in past")
private LocalDate dob;

@FutureOrPresent(message = "Event date must be in future")
private LocalDate eventDate;
```

---

### 7. Collections (@NotEmpty, @Size)

```java
@NotEmpty(message = "Must select at least one item")
@Size(max = 50, message = "Cannot select more than 50 items")
private List<Integer> memberIds;
```

---

## Priority Validation Implementation

### Priority 1: CRITICAL (Implement Immediately)
These handle sensitive operations and need strict validation:

```
✅ Auth DTOs (already done):
  - LoginRequest
  - RegisterRequest
  - ChangePasswordRequest
  - ResetPasswordRequest

⚠️ User Profile DTOs:
  - UpdateMyProfileRequest
  - UpdateAvatarRequest
  - UpdateCoverRequest
  - ChangeMyPasswordRequest

⚠️ Chat DTOs:
  - CreateGroupRequest
  - UpdateGroupRequest
  - AddMembersRequest

⚠️ Admin DTOs:
  - All admin create/update requests
```

### Priority 2: HIGH
User-generated content that could be exploited:

```
- News/Article create/update
- Comment/Post create
- Forum thread create
- Survey create/answer
- Event create/update
- Job posting create
```

### Priority 3: MEDIUM
Less critical but still important:

```
- Search filters
- Pagination parameters
- Optional profile fields
- Notification preferences
```

---

## DTO Validation Checklist Template

### For Every Request DTO:

```java
@Data
public class SampleRequest {
    
    // 1. String fields → @NotBlank + @Size
    @NotBlank(message = "Field is required")
    @Size(min = 1, max = 255, message = "Field must be 1-255 characters")
    private String name;
    
    // 2. ID fields → @NotNull + @Min
    @NotNull(message = "ID is required")
    @Min(value = 1, message = "ID must be positive")
    private Integer id;
    
    // 3. Email → @Email
    @Email(message = "Invalid email format")
    private String email;
    
    // 4. Phone → @Pattern
    @Pattern(regexp = "^0[35789]\\d{8}$", message = "Invalid phone")
    private String phone;
    
    // 5. Collections → @NotEmpty + @Size
    @NotEmpty(message = "Must select at least one")
    @Size(max = 100, message = "Cannot select more than 100")
    private List<Integer> ids;
    
    // 6. Dates → @PastOrPresent or @FutureOrPresent
    @PastOrPresent(message = "Date must not be in future")
    private LocalDate eventDate;
    
    // 7. Numbers → @Min + @Max
    @Min(value = 0, message = "Value must be >= 0")
    @Max(value = 100, message = "Value must be <= 100")
    private Integer percentage;
    
    // 8. Optional fields → Can be null but if provided, validate
    @Size(max = 1000, message = "Bio too long")
    private String bio;
}
```

---

## Controller Best Practices

### ✅ Good: Always use @Valid

```java
@RestController
@Validated  // ← Enable validation
public class UserController {
    
    @PostMapping("/update")
    public Mono<?> updateProfile(
        @Valid @RequestBody UpdateMyProfileRequest request  // ← @Valid
    ) {
        // Validation happens automatically
        // If invalid → 400 Bad Request with field errors
        // If valid → Process request
    }
}
```

### ❌ Bad: Missing @Valid

```java
@PostMapping("/update")
public Mono<?> updateProfile(
    @RequestBody UpdateMyProfileRequest request  // ❌ No @Valid!
) {
    // No validation happens!
    // Malicious input reaches service layer
}
```

---

## Common Validation Annotations

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@NotNull` | Cannot be null | ID fields |
| `@NotBlank` | Cannot be blank | Text inputs |
| `@NotEmpty` | Cannot be empty | Collections |
| `@Size(min, max)` | String/Collection size | `@Size(min=2, max=100)` |
| `@Min/@Max` | Number range | `@Min(0)` `@Max(100)` |
| `@Pattern` | Regex match | Phones, URLs |
| `@Email` | Valid email | Email fields |
| `@Positive/@Negative` | Number sign | Prices |
| `@PastOrPresent` | Date in past | Birth dates |
| `@FutureOrPresent` | Date in future | Event dates |

---

## Implementation Strategy

### Step 1: Review Current DTOs
```bash
# Find all Request DTOs
find . -name "*Request.java" -path "*/dto/*"

# Check which have @Valid annotations in controllers
grep -r "@Valid" src/main/java --include="*Controller.java"
```

### Step 2: Add Validation Incrementally

**Priority Order**:
1. Auth module (already done)
2. User module
3. Chat module
4. Event/Forum modules
5. Admin modules

### Step 3: Update Controllers

Ensure all endpoints use `@Valid`:
```bash
# Find endpoints without @Valid
grep -r "@RequestBody" src/main/java/*/controller --include="*Controller.java" | grep -v "@Valid"
```

### Step 4: Test Validation

```bash
# Test with invalid input
curl -X POST http://localhost:8080/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"name": "", "id": -1}'

# Expected response (400):
# {
#   "errorCode": "VALIDATION_FAILED",
#   "data": {
#     "name": "Name is required",
#     "id": "ID must be positive"
#   }
# }
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Missing @NotBlank on required strings
```java
// ❌ WRONG
private String name;

// ✅ CORRECT
@NotBlank(message = "Name is required")
private String name;
```

### ❌ Mistake 2: Missing @Valid in controller
```java
// ❌ WRONG
public void create(@RequestBody CreateRequest request)

// ✅ CORRECT
public void create(@Valid @RequestBody CreateRequest request)
```

### ❌ Mistake 3: Too permissive size limits
```java
// ❌ WRONG
@Size(max = 10000)  // Too large!
private String description;

// ✅ CORRECT
@Size(max = 500)    // Reasonable limit
private String description;
```

### ❌ Mistake 4: No message on validation errors
```java
// ❌ WRONG
@NotBlank
private String email;

// ✅ CORRECT
@NotBlank(message = "Email is required")
private String email;
```

---

## Performance Tips

### 1. Use @Validated on Controller class
Enables method-level validation:
```java
@RestController
@Validated  // ← This enables validation
public class MyController { }
```

### 2. Validation is fast
- Happens before method execution
- No database queries
- < 1ms overhead

### 3. Error response is automatic
GlobalExceptionHandler catches validation errors and returns:
```json
{
  "errorCode": "VALIDATION_FAILED",
  "data": {
    "field1": "error message",
    "field2": "error message"
  }
}
```

---

## Security Benefits

### 1. **Prevent Malicious Input**
```
Input: <script>alert('hack')</script>
Validation: @Size(max=100) ✅ blocked (too long)
Validation: @Pattern(regex="^[a-z]+$") ✅ blocked (invalid chars)
```

### 2. **Prevent Resource Exhaustion**
```
Input: Name = 1 million characters
Validation: @Size(max=100) ✅ blocked
Result: Server not overloaded
```

### 3. **Early Error Detection**
```
❌ Without validation: Error in service layer (expensive)
✅ With validation: Error caught at API boundary (cheap)
```

### 4. **Clear Error Messages**
```
Users know what's wrong: "Email must be valid"
vs generic error: "Bad request"
```

---

## Next Steps

### Immediate (This Sprint)
- [ ] Add validation to Priority 1 DTOs (User, Chat, Admin)
- [ ] Add `@Validated` to all Controllers
- [ ] Ensure all endpoints use `@Valid`
- [ ] Test with invalid input

### Short Term (Next Sprint)
- [ ] Add validation to Priority 2 DTOs (Content creation)
- [ ] Add validation to Priority 3 DTOs (Optional fields)
- [ ] Create validation test suite

### Long Term (Ongoing)
- [ ] Monitor validation errors in production
- [ ] Adjust size limits based on actual usage
- [ ] Add custom validators for business logic

---

## Summary

**Validation = Multiple Layers of Defense:**

1. **Frontend**: JavaScript validation (regexUtils.js)
2. **Backend DTOs**: Annotations (@Size, @Pattern, etc)
3. **Backend Logic**: GlobalExceptionHandler catches errors
4. **Backend Sanitization**: InputSanitizer removes malicious content

**Result**: Secure API that rejects invalid input early and safely.

