import { z } from 'zod';

/** Password pattern: at least one lowercase, uppercase, digit, special char @$!%*?& */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

/** Username: 3–50 chars, letters, numbers, dots, underscores, hyphens */
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/** OTP: exactly 6 digits */
const OTP_REGEX = /^[0-9]{6}$/;

const passwordSchema = z
  .string()
  .min(1, 'Mật khẩu là bắt buộc')
  .regex(PASSWORD_REGEX, 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)');

/** Login: backend LoginRequest — email (or username), password */
export const loginSchema = z.object({
  email: z.email("Email là bắt buộc"),
  password: passwordSchema,
});

/** Register: backend RegisterRequest — email, userName, password; UI: studentId, enrollmentYear (bắt buộc) */
export const registerSchema = z
  .object({
    userName: z
      .string()
      .min(1, 'Họ và tên là bắt buộc')
      .min(3, 'Họ và tên từ 3–50 ký tự')
      .max(50, 'Họ và tên từ 3–50 ký tự')
      .regex(USERNAME_REGEX, 'Họ và tên chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang'),
    studentId: z.string().min(1, 'Vui lòng chọn mã số sinh viên'),
    enrollmentYear: z.string().min(1, 'Vui lòng chọn năm nhập học'),
    email: z.email("Email là bắt buộc"),
    password: z
      .string()
      .min(1, 'Mật khẩu là bắt buộc')
      .min(8, 'Mật khẩu từ 8–100 ký tự')
      .max(100, 'Mật khẩu từ 8–100 ký tự')
      .regex(PASSWORD_REGEX, 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không trùng khớp',
    path: ['confirmPassword'],
  });

/** Send OTP: backend SendOtpRequest — email (forgot password / resend code) */
export const sendOtpSchema = z.object({
  email: z.email("Email là bắt buộc"),
});

/** Verify OTP: backend VerifyOtpRequest — email, otp */
export const verifyOtpSchema = z.object({
  email: z.email("Email là bắt buộc"),
  otp: z.string().min(1, 'Mã OTP là bắt buộc').regex(OTP_REGEX, 'Mã OTP phải là 6 chữ số'),
});

/** Change password: backend ChangePasswordRequest — oldPassword, newPassword (userId from store) */
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z
    .string()
    .min(1, 'Mật khẩu mới là bắt buộc')
    .min(8, 'Mật khẩu mới từ 8–50 ký tự')
    .max(50, 'Mật khẩu mới từ 8–50 ký tự')
    .regex(PASSWORD_REGEX, 'Mật khẩu phải có ít nhất một chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'),
  confirmNewPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Mật khẩu mới không trùng khớp',
  path: ['confirmNewPassword'],
});
