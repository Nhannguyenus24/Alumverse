import { z } from 'zod';
import dayjs from "dayjs";

// --- Regex Patterns ---

/** Password pattern: at least one lowercase, uppercase, digit, special char @$!%*?& */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

/** StudentId: digits only (mã số sinh viên chỉ gồm chữ số). */
const STUDENT_ID_REGEX = /^[0-9]+$/;

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

/** Register: backend RegisterRequest — email, studentId, fullName, password; UI: studentId, enrollmentYear (bắt buộc) */
export const getRegisterSchema = (t) => z
  .object({
    fullName: z
      .string()
      .min(1, t ? t('auth:fullname_required') : 'Họ và tên là bắt buộc')
      .min(2, t ? t('auth:fullname_length') : 'Họ và tên từ 2–100 ký tự')
      .max(100, t ? t('auth:fullname_length') : 'Họ và tên từ 2–100 ký tự'),
    enrollmentYear: z.string().min(1, t ? t('auth:enrollment_year_required') : 'Vui lòng chọn năm nhập học'),
    email: z.email(t ? t('auth:email_required') : "Email là bắt buộc"),
    password: z
      .string()
      .min(1, t ? t('auth:password_required') : 'Mật khẩu là bắt buộc')
      .min(8, t ? t('auth:password_length') : 'Mật khẩu từ 8–100 ký tự')
      .max(100, t ? t('auth:password_length') : 'Mật khẩu từ 8–100 ký tự')
      .regex(PASSWORD_REGEX, t ? t('auth:password_complexity') : 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'),
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
    .regex(PASSWORD_REGEX, t ? t('auth:password_complexity') : 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'),
  confirmNewPassword: z.string().min(1, t ? t('auth:confirm_new_password_required') : 'Vui lòng nhập lại mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: t ? t('auth:new_passwords_not_match') : 'Mật khẩu mới không trùng khớp',
  path: ['confirmNewPassword'],
});

/** @deprecated Use getChangePasswordSchema(t) instead */
export const changePasswordSchema = getChangePasswordSchema(null);

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
