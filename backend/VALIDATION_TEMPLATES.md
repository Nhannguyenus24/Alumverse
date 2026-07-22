# Validation Templates Library - Copy & Paste

Dùng templates này để thêm validation vào DTOs một cách nhanh chóng và consistent.

---

## 1. Basic Request Template

```java
package com.service.backend.MODULE.dto;

import jakarta.validation.constraints.*;
import java.util.*;
import lombok.Data;

@Data
public class SampleRequest {
    
    // ========== STRING FIELDS ==========
    
    @NotBlank(message = "Field is required")
    @Size(min = 1, max = 100, message = "Field must be 1-100 characters")
    private String title;
    
    @Size(max = 500, message = "Field must not exceed 500 characters")
    private String description;
    
    @Size(max = 1000, message = "Content must not exceed 1000 characters")
    private String content;
    
    // ========== EMAIL/PHONE ==========
    
    @Email(message = "Invalid email format")
    private String email;
    
    @Pattern(regexp = "^0[35789]\\d{8}$", message = "Invalid Vietnamese phone")
    private String phone;
    
    // ========== IDs & NUMBERS ==========
    
    @NotNull(message = "ID is required")
    @Min(value = 1, message = "ID must be positive")
    private Integer id;
    
    @Min(value = 0, message = "Amount must be >= 0")
    @Max(value = 1000000, message = "Amount too large")
    private BigDecimal amount;
    
    @Min(value = 0)
    @Max(value = 100)
    private Integer percentage;
    
    // ========== DATES ==========
    
    @PastOrPresent(message = "Date must not be in future")
    private LocalDate dob;
    
    @FutureOrPresent(message = "Date must not be in past")
    private LocalDate eventDate;
    
    // ========== COLLECTIONS ==========
    
    @NotEmpty(message = "Must select at least one")
    @Size(max = 100, message = "Cannot select more than 100")
    private List<Integer> ids;
    
    @Size(max = 50, message = "Cannot select more than 50")
    private List<String> tags;
    
    // ========== OPTIONAL FIELDS ==========
    
    @Size(max = 100)  // Optional but size-limited
    private String optionalField;
}
```

---

## 2. Event DTOs Template

```java
@Data
public class CreateEventRequest {
    
    @NotBlank(message = "Event title is required")
    @Size(min = 5, max = 200, message = "Title must be 5-200 characters")
    private String title;
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be 10-2000 characters")
    private String description;
    
    @NotNull(message = "Event date is required")
    @FutureOrPresent(message = "Event date must be in future")
    private LocalDateTime eventDate;
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1)
    private Integer organizationId;
    
    @Min(value = 1, message = "Total tickets must be >= 1")
    private Integer totalTickets;
    
    @Min(value = 0, message = "Price must be >= 0")
    private BigDecimal ticketPrice;
    
    @Size(max = 500, message = "Location too long")
    private String location;
}

@Data
public class UpdateEventRequest {
    
    @NotNull(message = "Event ID is required")
    @Min(value = 1)
    private Integer eventId;
    
    @Size(min = 5, max = 200)
    private String title;
    
    @Size(min = 10, max = 2000)
    private String description;
    
    @FutureOrPresent
    private LocalDateTime eventDate;
    
    @Min(value = 0)
    private BigDecimal ticketPrice;
    
    @Size(max = 500)
    private String location;
}

@Data
public class CreateEventCommentRequest {
    
    @NotNull(message = "Event ID is required")
    @Min(value = 1)
    private Integer eventId;
    
    @NotBlank(message = "Comment is required")
    @Size(min = 1, max = 500, message = "Comment must be 1-500 characters")
    private String content;
}

@Data
public class RegisterTicketRequest {
    
    @NotNull(message = "Event ID is required")
    @Min(value = 1)
    private Integer eventId;
    
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100)
    private String fullName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email")
    private String email;
    
    @Pattern(regexp = "^0[35789]\\d{8}$")
    private String phone;
    
    @NotEmpty(message = "Must answer at least one question")
    @Size(max = 100)
    private List<Integer> questionIds;
}

@Data
public class InviteUsersRequest {
    
    @NotNull(message = "Event ID is required")
    @Min(value = 1)
    private Integer eventId;
    
    @NotEmpty(message = "Must invite at least one user")
    @Size(max = 100, message = "Cannot invite more than 100 users")
    private List<Integer> userIds;
}
```

---

## 3. Forum DTOs Template

```java
@Data
public class CreatePostRequest {
    
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be 5-200 characters")
    private String title;
    
    @NotBlank(message = "Content is required")
    @Size(min = 10, max = 5000, message = "Content must be 10-5000 characters")
    private String content;
    
    @NotEmpty(message = "Must add at least one tag")
    @Size(max = 10, message = "Cannot add more than 10 tags")
    private List<String> tags;
    
    @NotNull(message = "Forum ID is required")
    @Min(value = 1)
    private Integer forumId;
}

@Data
public class UpdatePostRequest {
    
    @NotNull(message = "Post ID is required")
    @Min(value = 1)
    private Integer postId;
    
    @Size(min = 5, max = 200)
    private String title;
    
    @Size(min = 10, max = 5000)
    private String content;
    
    @Size(max = 10)
    private List<String> tags;
}

@Data
public class CreateCommentRequest {
    
    @NotNull(message = "Post ID is required")
    @Min(value = 1)
    private Integer postId;
    
    @NotBlank(message = "Comment is required")
    @Size(min = 1, max = 1000, message = "Comment must be 1-1000 characters")
    private String content;
}

@Data
public class CreateForumRequest {
    
    @NotBlank(message = "Forum name is required")
    @Size(min = 3, max = 100, message = "Name must be 3-100 characters")
    private String name;
    
    @Size(max = 500, message = "Description too long")
    private String description;
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1)
    private Integer organizationId;
}
```

---

## 4. Mentorship DTOs Template

```java
@Data
public class CreateMentorshipRequest {
    
    @NotNull(message = "Mentor ID is required")
    @Min(value = 1)
    private Integer mentorId;
    
    @NotNull(message = "Mentee ID is required")
    @Min(value = 1)
    private Integer menteeId;
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000)
    private String description;
    
    @FutureOrPresent(message = "Start date must be in future")
    private LocalDate startDate;
    
    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 month")
    @Max(value = 12, message = "Duration cannot exceed 12 months")
    private Integer durationMonths;
}

@Data
public class UpdateMentorshipRequest {
    
    @NotNull(message = "Mentorship ID is required")
    @Min(value = 1)
    private Integer mentorshipId;
    
    @Size(min = 10, max = 1000)
    private String description;
    
    @Min(value = 1)
    @Max(value = 12)
    private Integer durationMonths;
}

@Data
public class CreateMentorshipReviewRequest {
    
    @NotNull(message = "Mentorship ID is required")
    @Min(value = 1)
    private Integer mentorshipId;
    
    @NotBlank(message = "Review is required")
    @Size(min = 10, max = 1000)
    private String content;
    
    @Min(value = 1)
    @Max(value = 5)
    private Integer rating;
}
```

---

## 5. Admin DTOs Template

```java
@Data
public class CreateAnnouncementRequest {
    
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200)
    private String title;
    
    @NotBlank(message = "Content is required")
    @Size(min = 10, max = 3000)
    private String content;
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1)
    private Integer organizationId;
    
    @FutureOrPresent(message = "Publish date must be in future")
    private LocalDateTime publishDate;
}

@Data
public class BulkUserImportRequest {
    
    @NotEmpty(message = "Must import at least one user")
    @Size(max = 1000, message = "Cannot import more than 1000 users at once")
    private List<UserImportData> users;
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1)
    private Integer organizationId;
    
    @Data
    public static class UserImportData {
        @NotBlank @Email
        private String email;
        
        @NotBlank @Size(min = 2, max = 100)
        private String fullName;
        
        @Size(max = 50)
        private String studentId;
    }
}

@Data
public class SendBulkEmailRequest {
    
    @NotEmpty(message = "Must select at least one recipient")
    @Size(max = 1000, message = "Cannot send to more than 1000 users")
    private List<Integer> userIds;
    
    @NotBlank(message = "Subject is required")
    @Size(min = 5, max = 200)
    private String subject;
    
    @NotBlank(message = "Content is required")
    @Size(min = 10, max = 5000)
    private String content;
}
```

---

## 6. Article/News DTOs Template

```java
@Data
public class CreateArticleRequest {
    
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 300, message = "Title must be 5-300 characters")
    private String title;
    
    @NotBlank(message = "Content is required")
    @Size(min = 50, max = 10000)
    private String content;
    
    @Size(max = 500, message = "Summary too long")
    private String summary;
    
    @Size(max = 2000, message = "Featured image URL too long")
    private String featuredImage;
    
    @NotEmpty(message = "Must add at least one category")
    @Size(max = 10)
    private List<String> categories;
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1)
    private Integer organizationId;
}

@Data
public class UpdateArticleRequest {
    
    @NotNull(message = "Article ID is required")
    @Min(value = 1)
    private Integer articleId;
    
    @Size(min = 5, max = 300)
    private String title;
    
    @Size(min = 50, max = 10000)
    private String content;
    
    @Size(max = 500)
    private String summary;
    
    @Size(max = 2000)
    private String featuredImage;
    
    @Size(max = 10)
    private List<String> categories;
}
```

---

## 7. Survey DTOs Template

```java
@Data
public class CreateSurveyRequest {
    
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200)
    private String title;
    
    @Size(max = 500)
    private String description;
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1)
    private Integer organizationId;
    
    @FutureOrPresent
    private LocalDateTime endDate;
    
    @NotEmpty(message = "Must add at least one question")
    @Size(max = 100, message = "Cannot add more than 100 questions")
    private List<SurveyQuestion> questions;
    
    @Data
    public static class SurveyQuestion {
        @NotBlank @Size(min = 5, max = 500)
        private String text;
        
        @NotNull
        private String type; // MULTIPLE_CHOICE, SHORT_ANSWER, RATING
        
        @NotEmpty
        private List<String> options;
    }
}

@Data
public class SubmitSurveyRequest {
    
    @NotNull(message = "Survey ID is required")
    @Min(value = 1)
    private Integer surveyId;
    
    @NotEmpty(message = "Must answer all questions")
    private Map<Integer, Object> answers; // questionId -> answer
}
```

---

## 8. Fundraising DTOs Template

```java
@Data
public class CreateFundRequest {
    
    @NotBlank(message = "Fund title is required")
    @Size(min = 5, max = 200)
    private String title;
    
    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 2000)
    private String description;
    
    @NotNull(message = "Goal amount is required")
    @Min(value = 100000, message = "Minimum goal is 100,000")
    @Max(value = 1000000000, message = "Maximum goal is 1 billion")
    private BigDecimal goalAmount;
    
    @FutureOrPresent
    private LocalDate deadline;
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1)
    private Integer organizationId;
}

@Data
public class CreateFundDonationRequest {
    
    @NotNull(message = "Fund ID is required")
    @Min(value = 1)
    private Integer fundId;
    
    @NotNull(message = "Amount is required")
    @Min(value = 10000, message = "Minimum donation is 10,000")
    @Max(value = 10000000, message = "Maximum donation is 10 million")
    private BigDecimal amount;
    
    @Size(max = 500, message = "Message too long")
    private String message;
    
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100)
    private String donorName;
}
```

---

## Import Statements Template

Add these imports to all DTOs:

```java
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.*;
import lombok.Data;
```

---

## Validation Annotations Quick Reference

| Annotation | Field Type | Example |
|------------|-----------|---------|
| `@NotBlank` | String | Required text fields |
| `@NotNull` | Any | Required IDs, objects |
| `@NotEmpty` | Collection | Required lists |
| `@Size(min, max)` | String/Collection | Length/size limits |
| `@Min/@Max` | Number | Range validation |
| `@Email` | String | Email format |
| `@Pattern` | String | Regex pattern |
| `@PastOrPresent` | Date/DateTime | Birth dates |
| `@FutureOrPresent` | Date/DateTime | Event dates |
| `@Positive/@Negative` | Number | Sign validation |

---

## Copy-Paste Checklist

For each DTO, ensure:

- [ ] All String fields have @Size
- [ ] Required fields have @NotBlank or @NotNull
- [ ] ID fields have @Min(value = 1)
- [ ] Collections have @NotEmpty or @Size(max)
- [ ] Email fields have @Email
- [ ] Phone fields have @Pattern
- [ ] Date fields have @PastOrPresent or @FutureOrPresent
- [ ] Amount fields have @Min(0) and @Max(reasonable)
- [ ] All annotations have message parameter
- [ ] Proper imports are included

---

## Implementation Strategy

1. Copy template for your module
2. Customize field names and messages
3. Adjust size limits based on domain
4. Add @Valid in controller
5. Test with curl/Postman
6. Verify build: `mvn clean compile`

