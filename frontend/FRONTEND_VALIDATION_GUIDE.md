# Frontend Input Validation Implementation Guide

This guide describes how to apply input validation to all frontend pages using the validation utilities created.

## Available Resources

### 1. Validation Utilities
- **Location**: `src/utils/validationUtils.js`
- **Purpose**: Standalone validation functions (email, phone, password, size checks)
- **Use for**: Non-Zod pages, plain-state forms, utility functions

### 2. Zod Validation Schemas  
- **Location**: `src/utils/regexUtils.js`
- **Purpose**: Zod schema definitions for form validation with react-hook-form
- **Use for**: Form pages with react-hook-form integration

## Validation Schemas Available

### Authentication Pages
```javascript
import { getLoginSchema, getRegisterSchema, getChangePasswordSchema } from '../../utils/regexUtils';

// Used in: LoginPage.jsx, RegisterPage.jsx, SettingPage.jsx
```

### User Profile
```javascript
import { getUpdateMyProfileSchema } from '../../utils/regexUtils';

// Used in: MyProfileEditPage.jsx
const schema = getUpdateMyProfileSchema(t);
```

### Content Creation
```javascript
import {
  getCreateEventSchema,
  getCreateForumPostSchema,
  getCreateForumTopicSchema,
  getCreateNewsSchema,
} from '../../utils/regexUtils';
```

### Chat & Groups
```javascript
import { getCreateGroupSchema, getAddMembersSchema } from '../../utils/regexUtils';

// Used in: ChatPage.jsx group creation
```

### Mentorship
```javascript
import {
  getCreateMentorProfileSchema,
  getCreateMenteeProfileSchema,
} from '../../utils/regexUtils';

// Used in: MentorshipSignupPage.jsx, MenteeSignupPage.jsx
```

### Other Forms
```javascript
import {
  getCreateSurveySchema,
  getContactSchema,
} from '../../utils/regexUtils';

// Used in: SurveyFillPage.jsx, ContactPage.jsx
```

## Implementation Patterns

### Pattern 1: Using React Hook Form + Zod (Recommended)

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCreateEventSchema } from '../../utils/regexUtils';

const CreateEventForm = () => {
  const { t } = useTranslation();
  const schema = useMemo(() => getCreateEventSchema(t), [t]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = async (data) => {
    try {
      await createEvent(data);
    } catch (error) {
      // Handle API errors
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register('title')}
        error={!!errors.title}
        helperText={errors.title?.message}
      />
      <button type="submit">Create</button>
    </form>
  );
};
```

### Pattern 2: Using Standalone Validation Functions

For pages without react-hook-form:

```javascript
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidPassword,
  getValidationError,
} from '../../utils/validationUtils';

const handleSubmit = (formData) => {
  const errors = {};

  if (!isValidEmail(formData.email)) {
    errors.email = getValidationError('Email', 'Email');
  }

  if (formData.phone && !isValidPhoneNumber(formData.phone)) {
    errors.phone = getValidationError('Phone', 'Phone');
  }

  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }

  // Submit to API
  submitForm(formData);
};
```

## Pages Priority & Implementation Status

### ✅ Already Validated (via existing Zod schemas)
- `LoginPage.jsx` - Uses `getLoginSchema(t)`
- `RegisterPage.jsx` - Uses `getRegisterSchema(t)`
- `ForgotPasswordPage.jsx` - Uses `getSendOtpSchema(t)`
- `ResetPasswordPage.jsx` - Uses `getChangePasswordSchema(t)`
- `ForceChangePasswordPage.jsx` - Uses `getChangePasswordSchema(t)`

### 🔄 Needs Implementation

#### Authentication (2 pages)
- [ ] `OrganizationRegistrationPage.jsx` - Add organization registration validation
- [ ] `SignupCodePage.jsx` - Add signup code validation

#### User Module (3 pages)
- [ ] `MyProfileEditPage.jsx` - Add `getUpdateMyProfileSchema(t)` validation
- [ ] `SettingPage.jsx` - Add password change validation
- [ ] `NotificationPage.jsx` - Add notification preference validation

#### Content Creation (6 pages)
- [ ] `PostArticlePage.jsx` - Add `getCreateNewsSchema(t)` validation
- [ ] `PostArticleEventPage.jsx` - Add event-specific validation
- [ ] `PostArticleGenericPage.jsx` - Add generic article validation
- [ ] `PostArticleDonationPage.jsx` - Add donation validation
- [ ] `ForumAlumniCreateTopicPage.jsx` - Add `getCreateForumTopicSchema(t)` validation
- [ ] `ContactPage.jsx` - Add `getContactSchema(t)` validation

#### Event Management (Admin) (4 pages)
- [ ] `AdminEventManagePage.jsx` - Add event management validation
- [ ] `AdminEventOrganizePage.jsx` - Add event organization validation
- [ ] `AdminEventsPage.jsx` - Add bulk event validation
- [ ] `InviteUsersRequest` - Add invite validation

#### Forum (3 pages)
- [ ] `ForumAlumniCreateTopicPage.jsx` - Already listed above
- [ ] `ForumAlumniThreadPage.jsx` - Add comment validation
- [ ] `ForumPage.jsx` - Add post validation

#### Admin Pages (15+ pages)
- [ ] `AdminArticlesPage.jsx` - Add article validation
- [ ] `AdminArticleRequestsPage.jsx` - Add request validation
- [ ] `AdminEditArticlePage.jsx` - Add article edit validation
- [ ] `AdminEmailTemplatesPage.jsx` - Add email template validation
- [ ] `AdminForumCategoriesPage.jsx` - Add category validation
- [ ] `AdminForumTopicsPage.jsx` - Add topic validation
- [ ] `AdminFundraisingsPage.jsx` - Add fundraising validation
- [ ] `AdminAiProvidersPage.jsx` - Add AI provider validation
- [ ] `AdminUsersListPage.jsx` - Add user management validation
- [ ] `AdminUserDetailPage.jsx` - Add user detail validation
- [ ] `AdminSurveyResultsPage.jsx` - Add survey validation
- [ ] `AdminFormPage.jsx` - Add form validation

#### Mentorship (3 pages)
- [ ] `MenteeSignupPage.jsx` - Add `getCreateMenteeProfileSchema(t)` validation
- [ ] `MentorshipSignupPage.jsx` - Add `getCreateMentorProfileSchema(t)` validation
- [ ] `MentorshipYourCalendarPage.jsx` - Add availability validation

#### Chat & Groups (2 pages)
- [ ] `ChatPage.jsx` - Add `getCreateGroupSchema(t)` and `getAddMembersSchema(t)` validation
- [ ] `UpdateGroupRequest` - Add group update validation

#### Donation (2 pages)
- [ ] `EditDonationPage.jsx` - Add donation edit validation
- [ ] `DonationDetailPage.jsx` - Add donation detail validation

#### Survey (1 page)
- [ ] `SurveyFillPage.jsx` - Add `getCreateSurveySchema(t)` validation

## Validation Rules Reference

### Constraints
- **String fields**: max 255 characters
- **Text/Content fields**: min 10, max 5000 characters
- **Title fields**: min 3, max 255 characters
- **Group names**: min 2, max 100 characters
- **Email**: RFC 5322 standard format
- **Phone**: Vietnamese format `0[35789]xxxxxxxx` (10 digits)
- **Password**: 8-100 chars, requires uppercase, lowercase, digit, special char
- **ID fields**: positive integers only
- **Lists/Arrays**: max 100 items

## Error Message Localization

All error messages are mapped to i18n keys for translation:
- `auth:*` - Authentication errors
- `user:*` - User profile errors
- `event:*` - Event errors
- `forum:*` - Forum errors
- `article:*` - Article errors
- `chat:*` - Chat errors
- `contact:*` - Contact form errors
- `common:*` - General/common errors

## Testing Validation

Test each form with invalid inputs to verify validation:

```bash
# Test with curl (backend validation)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":""}'

# Expected: 400 Bad Request with validation error messages
```

## Backend Error Code Mapping

The backend returns error codes that map to frontend error messages:

```javascript
// Map backend error codes to i18n keys
const errorCodeMap = {
  'INVALID_CREDENTIALS': 'auth:login_invalid',
  'INVALID_PASSWORD': 'auth:password_invalid',
  'EMAIL_ALREADY_EXISTS': 'auth:email_exists',
  'ACCOUNT_LOCKED': 'auth:account_locked', // 429 Too Many Requests
  'OTP_EXPIRED': 'auth:otp_expired',
  'INVALID_OTP': 'auth:otp_invalid',
};
```

## Next Steps

1. **Priority 1**: Update authentication pages with existing schemas
2. **Priority 2**: Update user profile and chat pages
3. **Priority 3**: Update content creation pages (event, forum, article)
4. **Priority 4**: Update admin pages with batch validation
5. **Priority 5**: Test all forms end-to-end with invalid inputs

## Files to Update

- `frontend/src/pages/authentication/*.jsx` - Already mostly done
- `frontend/src/pages/user/*.jsx` - Profile & settings
- `frontend/src/pages/admin/*.jsx` - Admin panels
- `frontend/src/pages/alumni/Forum*.jsx` - Forum pages
- `frontend/src/pages/user/PostArticle*.jsx` - Article posting
- `frontend/src/pages/mentorship/*.jsx` - Mentorship pages
- `frontend/src/pages/chat/ChatPage.jsx` - Group creation
- `frontend/src/pages/donation/*.jsx` - Donation pages
- `frontend/src/pages/public/ContactPage.jsx` - Contact form

## Support

For adding new validation schemas:
1. Add schema to `regexUtils.js` following existing patterns
2. Export the `getSchemaName` function
3. Import and use in the page component with react-hook-form + zodResolver
4. Add error messages to i18n translation files
5. Test with both valid and invalid inputs
