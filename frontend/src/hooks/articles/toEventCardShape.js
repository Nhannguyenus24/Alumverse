import { normalizePreviewText } from "../../utils/text";

const formatDateRange = (start, end) => {
  if (!start) return "";
  const s = new Date(start);
  const sText = s.toLocaleDateString("vi-VN");
  if (!end) return sText;
  const e = new Date(end);
  const eText = e.toLocaleDateString("vi-VN");
  return `${sText} - ${eText}`;
};

export const toEventCardShape = (event) => {
  if (!event) return null;
  const raw = event.content ?? "";
  const plain = normalizePreviewText(raw);
  const description = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;

  return {
    id: event.id,
    channel: event.channel ?? "event",
    title: normalizePreviewText(event.title),
    date: formatDateRange(event.eventDate, event.eventEndDate),
    organizer: event.organizer ?? event.location ?? "",
    participants: event.joinedCount ?? 0,
    interested: event.interestedCount ?? 0,
    isRegistered: event.isRegistered ?? event.registered ?? event.hasRegistered ?? false,
    registrationEndAt: event.registrationEndAt,
    description,
    image: event.thumbnailUrl ?? "/placeholder-image.png",
  };
};
