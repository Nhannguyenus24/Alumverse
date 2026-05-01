import dayjs from "dayjs";

export const DONATION_SEARCH_OPTIONS = [
  { value: "name", label: "Tên" },
  { value: "phone", label: "Số điện thoại" },
  { value: "address", label: "Địa chỉ" },
  { value: "message", label: "Thông điệp" },
  { value: "email", label: "Email" },
];

export const DONATION_AVATAR_FALLBACK = "/school_logo/HCMUS_Logo_Main.svg";

export const formatDonationTimestamp = (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--");

export const formatDonationAmount = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} VND`;
