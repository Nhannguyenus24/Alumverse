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

export const NON_CANCELABLE_TICKET_STATUSES = new Set([
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
