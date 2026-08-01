export const getEventRegisteredState = (response) => {
  if (typeof response === "boolean") return response;
  if (!response || typeof response !== "object") return false;

  return Boolean(
    response.isRegistered
      ?? response.registered
      ?? response.hasRegistered
      ?? response.data?.isRegistered
      ?? response.data?.registered
      ?? response.data?.hasRegistered
      ?? response.ticket?.id
      ?? response.ticketId
  );
};

const NON_CANCELABLE_TICKET_STATUSES = new Set([
  "ACTIVE",
  "USED",
  "CHECKED_IN",
  "EXPIRED",
  "CANCELLED",
  "REJECTED",
]);

export const canCancelEventTicketStatus = (status) =>
  !NON_CANCELABLE_TICKET_STATUSES.has(String(status ?? "").toUpperCase());

export const findCancelableTicketForEvent = (tickets, eventId) => {
  if (!Array.isArray(tickets)) return null;

  return tickets.find((ticket) => (
    Number(ticket?.eventId) === Number(eventId)
      && ticket?.ticketCode
      && canCancelEventTicketStatus(ticket?.status)
  )) ?? null;
};

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getEventActionState = ({
  event,
  isJoined,
  ticketStatus,
  canUseAction = true,
  loading = false,
  checking = false,
  now = new Date(),
} = {}) => {
  const normalizedStatus = String(ticketStatus ?? "").toUpperCase();
  const isTicketUsed = ["USED", "CHECKED_IN"].includes(normalizedStatus);
  const isTicketBanned = normalizedStatus === "BANNED";
  const isTicketExpired = normalizedStatus === "EXPIRED";
  const isTicketCancelled = ["CANCELLED", "REJECTED"].includes(normalizedStatus);

  const registrationEndAt = toValidDate(event?.registrationEndAt ?? event?.registration_end_at);
  const startTime = toValidDate(event?.startTime ?? event?.eventDate);
  const endTime = toValidDate(event?.endTime ?? event?.eventEndDate);
  const eventOccurred = endTime ? now > endTime : Boolean(startTime && now > startTime);
  const registrationClosed = Boolean(registrationEndAt && now > registrationEndAt);
  const baseDisabled = Boolean(loading || checking || !canUseAction);

  if (isJoined) {
    if (isTicketBanned) {
      return {
        state: "banned",
        labelKey: "event:ticket_status_banned",
        color: "error",
        variant: "contained",
        disabled: true,
        icon: "blocked",
      };
    }
    if (isTicketUsed) {
      return {
        state: "attended",
        labelKey: "event:status_used",
        color: "success",
        variant: "contained",
        disabled: true,
        icon: "available",
      };
    }
    if (isTicketExpired) {
      return {
        state: "expired",
        labelKey: "event:status_expired",
        color: "inherit",
        variant: "contained",
        disabled: true,
        icon: "busy",
      };
    }
    if (isTicketCancelled) {
      return {
        state: "cancelled",
        labelKey: "event:status_cancelled",
        color: "inherit",
        variant: "contained",
        disabled: true,
        icon: "busy",
      };
    }
    return {
      state: "cancel",
      labelKey: "event:cancel_ticket",
      color: "error",
      variant: "outlined",
      disabled: baseDisabled,
      icon: "busy",
    };
  }

  if (eventOccurred) {
    return {
      state: "occurred",
      labelKey: "event:registration_closed",
      color: "inherit",
      variant: "contained",
      disabled: true,
      icon: "available",
    };
  }

  if (registrationClosed) {
    return {
      state: "registrationClosed",
      labelKey: "event:registration_window_closed",
      color: "inherit",
      variant: "contained",
      disabled: true,
      icon: "busy",
    };
  }

  return {
    state: "join",
    labelKey: "event:join",
    color: "accent",
    variant: "contained",
    disabled: baseDisabled,
    icon: "available",
  };
};
