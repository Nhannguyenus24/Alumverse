import { z } from 'zod';
import dayjs from "dayjs";

// --- Regex Patterns ---

/** Password pattern: at least one lowercase, uppercase, digit, and non-alphanumeric special character. */
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-z0-9\s]/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/;

export const getPasswordRequirementState = (value = '') => ({
  length: value.length >= 8,
  uppercase: /[A-Z]/.test(value),
  lowercase: /[a-z]/.test(value),
  digit: /\d/.test(value),
  special: PASSWORD_SPECIAL_REGEX.test(value),
});

/** OTP: exactly 6 digits */
const OTP_REGEX = /^[0-9]{6}$/;

/** Vietnamese mobile: 10 digits, leading 0, carrier prefix 3/5/7/8/9. */
export const VIETNAM_PHONE_REGEX = /^0[35789]\d{8}$/;

/**
 * Validate a Vietnamese phone string. Returns an error message or null.
 * Used outside zod (e.g. plain-state forms like ContactPage).
 * Pass `t` as the third argument for i18n error messages.
 */
export const validateVietnamPhone = (value, { optional = false } = {}, t) => {
  const v = (value ?? '').trim();
  if (!v) return optional ? null : (t ? t('auth:phone_required') : 'Số điện thoại không được để trống');
  if (!/^\d+$/.test(v)) return t ? t('auth:phone_digits_only') : 'Số điện thoại chỉ gồm chữ số';
  if (v.length !== 10) return t ? t('auth:phone_length') : 'Số điện thoại phải có đúng 10 chữ số';
  if (!VIETNAM_PHONE_REGEX.test(v)) return t ? t('auth:phone_invalid') : 'Số điện thoại không hợp lệ (đầu số Việt Nam)';
  return null;
};

/**
 * A reusable zod field for an optional Vietnamese phone number. Empty string
 * passes; otherwise must match the VN mobile format.
 */

/** Login: backend LoginRequest — email, password */
export const getLoginSchema = (t) => z.object({
  email: z.string().min(1, t ? t('auth:login_invalid') : "Email hoặc mật khẩu không đúng"),
  password: z.string().min(1, t ? t('auth:login_invalid') : "Email hoặc mật khẩu không đúng"),
  rememberMe: z.boolean().optional(),
  recaptchaToken: z.string().min(1, t ? t('auth:captcha_required') : "Vui lòng xác nhận bạn không phải là người máy"),
});

/** @deprecated Use getLoginSchema(t) instead */
export const loginSchema = getLoginSchema(null);

/** Register: backend RegisterRequest — email, fullName, password */
export const getRegisterSchema = (t) => z
  .object({
    fullName: z
      .string()
      .min(1, t ? t('auth:fullname_required') : 'Họ và tên là bắt buộc')
      .min(2, t ? t('auth:fullname_length') : 'Họ và tên từ 2–100 ký tự')
      .max(100, t ? t('auth:fullname_length') : 'Họ và tên từ 2–100 ký tự'),
    email: z.email(t ? t('auth:email_required') : "Email là bắt buộc"),
    password: z
      .string()
      .min(1, t ? t('auth:password_required') : 'Mật khẩu là bắt buộc')
      .min(8, t ? t('auth:password_length') : 'Mật khẩu từ 8–100 ký tự')
      .max(100, t ? t('auth:password_length') : 'Mật khẩu từ 8–100 ký tự')
      .regex(PASSWORD_REGEX, t ? t('auth:password_complexity') : 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt'),
    confirmPassword: z.string().min(1, t ? t('auth:confirm_password_required') : 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t ? t('auth:passwords_not_match') : 'Mật khẩu không trùng khớp',
    path: ['confirmPassword'],
  });

/** @deprecated Use getRegisterSchema(t) instead */
export const registerSchema = getRegisterSchema(null);

/** Send OTP: backend SendOtpRequest — email (forgot password / resend code) */
const getSendOtpSchema = (t) => z.object({
  email: z.email(t ? t('auth:email_required') : "Email là bắt buộc"),
});

/** @deprecated Use getSendOtpSchema(t) instead */
export const sendOtpSchema = getSendOtpSchema(null);

/** Verify OTP: backend VerifyOtpRequest — email, otp */
const getVerifyOtpSchema = (t) => z.object({
  email: z.email(t ? t('auth:email_required') : "Email là bắt buộc"),
  otp: z.string().min(1, t ? t('auth:otp_required') : 'Mã OTP là bắt buộc').regex(OTP_REGEX, t ? t('auth:otp_format') : 'Mã OTP phải là 6 chữ số'),
});

/** @deprecated Use getVerifyOtpSchema(t) instead */
export const verifyOtpSchema = getVerifyOtpSchema(null);

/** Change password: backend ChangePasswordRequest — oldPassword, newPassword (userId from store) */
export const getChangePasswordSchema = (t) => z.object({
  oldPassword: z.string().min(1, t ? t('auth:old_password_required') : 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z
    .string()
    .min(1, t ? t('auth:new_password_required') : 'Mật khẩu mới là bắt buộc')
    .min(8, t ? t('auth:new_password_length') : 'Mật khẩu mới từ 8–50 ký tự')
    .max(50, t ? t('auth:new_password_length') : 'Mật khẩu mới từ 8–50 ký tự')
    .regex(PASSWORD_REGEX, t ? t('auth:password_complexity') : 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt'),
  confirmNewPassword: z.string().min(1, t ? t('auth:confirm_new_password_required') : 'Vui lòng nhập lại mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: t ? t('auth:new_passwords_not_match') : 'Mật khẩu mới không trùng khớp',
  path: ['confirmNewPassword'],
});

/** Change password API payload: backend only accepts oldPassword and newPassword. */
const getChangePasswordRequestSchema = (t) => z.object({
  oldPassword: z.string().min(1, t ? t('auth:old_password_required') : 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z
    .string()
    .min(1, t ? t('auth:new_password_required') : 'Mật khẩu mới là bắt buộc')
    .min(8, t ? t('auth:new_password_length') : 'Mật khẩu mới từ 8–50 ký tự')
    .max(50, t ? t('auth:new_password_length') : 'Mật khẩu mới từ 8–50 ký tự')
    .regex(PASSWORD_REGEX, t ? t('auth:password_complexity') : 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt'),
});

/** @deprecated Use getChangePasswordSchema(t) instead */
const changePasswordSchema = getChangePasswordSchema(null);

/** @deprecated Use getChangePasswordRequestSchema(t) instead */
export const changePasswordRequestSchema = getChangePasswordRequestSchema(null);

// --- Donation Schemas & Utils ---

export const getDonationSearchOptions = (t) => [
  { value: "name", label: t ? t('contact:field_name') : "Tên" },
  { value: "phone", label: t ? t('contact:field_phone') : "Số điện thoại" },
  { value: "address", label: t ? t('contact:field_address') : "Địa chỉ" },
  { value: "message", label: t ? t('contact:field_message') : "Thông điệp" },
  { value: "email", label: "Email" },
];

/** @deprecated Use getDonationSearchOptions(t) instead */
const DONATION_SEARCH_OPTIONS = getDonationSearchOptions(null);

export const DONATION_AVATAR_FALLBACK = "/school_logo/HCMUS_Logo_Main.svg";

export const formatDonationTimestamp = (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--");

export const formatDonationAmount = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} VND`;

// --- User Profile Schemas ---

/** Update My Profile: backend UpdateMyProfileRequest */
const getUpdateMyProfileSchema = (t) => z.object({
  fullName: z.string().max(255, t ? t('user:fullname_too_long') : 'Họ tên tối đa 255 ký tự').optional().nullable(),
  phone: z
    .string()
    .refine(
      (v) => !v || VIETNAM_PHONE_REGEX.test(v),
      t ? t('auth:phone_invalid') : 'Số điện thoại không hợp lệ'
    )
    .optional()
    .nullable(),
  gender: z.string().max(255).optional().nullable(),
  dob: z.string().optional().nullable(),
  bio: z.string().max(255, t ? t('user:bio_too_long') : 'Tiểu sử tối đa 255 ký tự').optional().nullable(),
  currentJobTitle: z.string().max(255).optional().nullable(),
  currentCompany: z.string().max(255).optional().nullable(),
  organizationId: z.number().int().positive(t ? t('common:invalid_id') : 'ID tổ chức không hợp lệ'),
});

// --- Event Schemas ---

/** Create Event: backend CreateEventRequest */
const getCreateEventSchema = (t) => z.object({
  title: z
    .string()
    .min(1, t ? t('event:title_required') : 'Tiêu đề sự kiện là bắt buộc')
    .min(3, t ? t('event:title_length') : 'Tiêu đề từ 3–255 ký tự')
    .max(255, t ? t('event:title_length') : 'Tiêu đề từ 3–255 ký tự'),
  description: z.string().max(255).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  registrationStartAt: z.string().optional().nullable(),
  registrationEndAt: z.string().optional().nullable(),
});

// --- Forum Schemas ---

/** Create Forum Post: backend CreateForumPostRequest */
const getCreateForumPostSchema = (t) => z.object({
  topicId: z.number().int().positive(t ? t('common:invalid_id') : 'ID chủ đề không hợp lệ'),
  content: z
    .string()
    .min(1, t ? t('forum:content_required') : 'Nội dung bài viết là bắt buộc')
    .min(10, t ? t('forum:content_length') : 'Nội dung từ 10–5000 ký tự')
    .max(5000, t ? t('forum:content_length') : 'Nội dung từ 10–5000 ký tự'),
});

/** Create Forum Topic: backend CreateForumTopicRequest */
const getCreateForumTopicSchema = (t) => z.object({
  categoryId: z.number().int().positive(t ? t('common:invalid_id') : 'ID danh mục không hợp lệ'),
  title: z
    .string()
    .min(1, t ? t('forum:title_required') : 'Tiêu đề chủ đề là bắt buộc')
    .min(3, t ? t('forum:title_length') : 'Tiêu đề từ 3–255 ký tự')
    .max(255, t ? t('forum:title_length') : 'Tiêu đề từ 3–255 ký tự'),
  content: z
    .string()
    .min(1, t ? t('forum:content_required') : 'Nội dung chủ đề là bắt buộc')
    .min(10, t ? t('forum:content_length') : 'Nội dung từ 10–5000 ký tự')
    .max(5000, t ? t('forum:content_length') : 'Nội dung từ 10–5000 ký tự'),
});

// --- Article Schemas ---

/** Create News Article: backend CreateNewsRequest */
const getCreateNewsSchema = (t) => z.object({
  title: z
    .string()
    .min(1, t ? t('article:title_required') : 'Tiêu đề bài viết là bắt buộc')
    .min(3, t ? t('article:title_length') : 'Tiêu đề từ 3–255 ký tự')
    .max(255, t ? t('article:title_length') : 'Tiêu đề từ 3–255 ký tự'),
  description: z.string().max(255).optional().nullable(),
  content: z
    .string()
    .min(1, t ? t('article:content_required') : 'Nội dung bài viết là bắt buộc')
    .min(10, t ? t('article:content_length') : 'Nội dung từ 10–5000 ký tự')
    .max(5000, t ? t('article:content_length') : 'Nội dung từ 10–5000 ký tự'),
  thumbnail: z.string().url(t ? t('common:invalid_url') : 'URL hình ảnh không hợp lệ').optional().nullable(),
});

// --- Chat/Group Schemas ---

/** Create Group: backend CreateGroupRequest */
const getCreateGroupSchema = (t) => z.object({
  title: z
    .string()
    .min(1, t ? t('chat:group_name_required') : 'Tên nhóm là bắt buộc')
    .min(2, t ? t('chat:group_name_length') : 'Tên nhóm từ 2–100 ký tự')
    .max(100, t ? t('chat:group_name_length') : 'Tên nhóm từ 2–100 ký tự'),
});

/** Add Members to Group: backend AddMembersRequest */
const getAddMembersSchema = (t) => z.object({
  memberIds: z
    .array(z.number().int().positive())
    .min(1, t ? t('chat:members_required') : 'Phải chọn ít nhất một thành viên')
    .max(100, t ? t('chat:members_too_many') : 'Tối đa 100 thành viên'),
});

// --- Mentorship Schemas ---

/** Create Mentor Profile: backend CreateMentorProfileRequest */
const getCreateMentorProfileSchema = (t) => z.object({
  bio: z.string().max(255).optional().nullable(),
  meetingLink: z
    .string()
    .url(t ? t('common:invalid_url') : 'Link tham gia không hợp lệ')
    .optional()
    .nullable(),
});

/** Create Mentee Profile: backend CreateMenteeProfileRequest */
const getCreateMenteeProfileSchema = (t) => z.object({
  bio: z.string().max(255).optional().nullable(),
});

// --- Survey Schemas ---

/** Create Survey: backend CreateSurveyRequest */
const getCreateSurveySchema = (t) => z.object({
  title: z
    .string()
    .min(1, t ? t('survey:title_required') : 'Tiêu đề khảo sát là bắt buộc')
    .max(255),
  description: z.string().max(255).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// --- Contact/General Schemas ---

/** Contact Form: public contact page */
const getContactSchema = (t) => z.object({
  name: z
    .string()
    .min(1, t ? t('contact:field_name_required') : 'Tên là bắt buộc')
    .min(2, t ? t('contact:field_name_length') : 'Tên từ 2–255 ký tự')
    .max(255),
  email: z.email(t ? t('auth:email_required') : 'Email không hợp lệ'),
  phone: z
    .string()
    .refine(
      (v) => !v || VIETNAM_PHONE_REGEX.test(v),
      t ? t('auth:phone_invalid') : 'Số điện thoại không hợp lệ'
    )
    .optional(),
  message: z
    .string()
    .min(1, t ? t('contact:field_message_required') : 'Thông điệp là bắt buộc')
    .min(10, t ? t('contact:field_message_length') : 'Thông điệp tối thiểu 10 ký tự')
    .max(2000, t ? t('contact:field_message_max') : 'Thông điệp tối đa 2000 ký tự'),
});
