import { resolveMediaUrl } from "../../utils/imageUtils";

export const normalizeNews = (data) => {
  if (!data) return null;
  const createdAt = data.createdAt ?? data.created_at;
  const updatedAt = data.updatedAt ?? data.updated_at;
  const displayDate = updatedAt ?? createdAt;
  return {
    id: data.id,
    channel: "news",
    title: data.title,
    content: data.content,
    thumbnailUrl: resolveMediaUrl(data.thumbnailUrl),
    publishedAt: displayDate,
    createdAt,
    updatedAt,
    authorMemberId: data.authorMemberId ?? data.author_member_id,
    topic: data.topic,
    url: data.url,
  };
};

export const normalizeAlumniPost = (data) => {
  if (!data) return null;
  const createdAt = data.createdAt ?? data.created_at;
  const updatedAt = data.updatedAt ?? data.updated_at;
  const displayDate = updatedAt ?? createdAt;
  return {
    id: data.id,
    channel: "alumni",
    title: data.title,
    content: data.content,
    thumbnailUrl: resolveMediaUrl(data.thumbnailUrl),
    publishedAt: displayDate,
    createdAt,
    updatedAt,
    authorMemberId: data.authorMemberId ?? data.author_member_id,
    topic: data.topic,
    url: data.url,
  };
};

export const normalizeEvent = (data) => {
  if (!data) return null;
  const createdAt = data.createdAt ?? data.created_at;
  const updatedAt = data.updatedAt ?? data.updated_at;
  const displayDate = updatedAt ?? createdAt;
  return {
    id: data.id,
    channel: "event",
    title: data.title,
    content: data.description,
    thumbnailUrl: resolveMediaUrl(data.bannerUrl),
    publishedAt: displayDate,
    createdAt,
    updatedAt,
    authorMemberId: data.creatorMemberId ?? data.creator_member_id,
    organizer: data.organizer ?? null,
    eventDate: data.startTime,
    eventEndDate: data.endTime,
    registrationEndAt: data.registrationEndAt ?? data.registration_end_at,
    location: data.location,
    interestedCount: data.interestedCount ?? 0,
    joinedCount: data.joinedCount ?? 0,
    isRegistered: data.isRegistered ?? data.registered ?? data.hasRegistered ?? false,
    maxCapacity: data.maxCapacity,
    topic: data.topic,
  };
};

export const normalizeJob = (data) => {
  if (!data) return null;
  const createdAt = data.createdAt ?? data.created_at;
  const updatedAt = data.updatedAt ?? data.updated_at;
  const displayDate = updatedAt ?? createdAt;
  const topic = data.topic ?? data.type;
  return {
    id: data.id,
    channel: "job",
    title: data.title,
    content: data.description,
    thumbnailUrl: resolveMediaUrl(data.url),
    publishedAt: displayDate,
    createdAt,
    updatedAt,
    authorMemberId: data.posterMemberId ?? data.poster_member_id,
    companyName: data.companyName,
    location: data.location,
    salaryRange: data.salaryRange,
    deadline: data.deadline,
    howToApply: data.howToApply,
    type: data.type,
    isReferral: data.isReferral ?? data.is_referral ?? false,
    topic,
    url: data.url,
  };
};

export const normalizeAchievement = (data) => {
  if (!data) return null;
  const createdAt = data.createdAt ?? data.created_at;
  const updatedAt = data.updatedAt ?? data.updated_at;
  const displayDate = updatedAt ?? createdAt;
  return {
    id: data.id,
    channel: "achievement",
    organizationId: data.organizationId ?? data.organization_id,
    title: data.title,
    content: data.description,
    thumbnailUrl: resolveMediaUrl(data.imageUrl),
    publishedAt: displayDate,
    createdAt,
    updatedAt,
    authorMemberId: data.memberId ?? data.member_id,
    status: data.status,
    topic: data.topic,
    memberName: data.memberName,
    memberAvatar: data.memberAvatar,
    memberJobTitle: data.memberJobTitle,
    memberCompany: data.memberCompany,
    url: data.url,
  };
};

export const normalizeLearning = (data) => {
  if (!data) return null;
  const createdAt = data.createdAt ?? data.created_at;
  const updatedAt = data.updatedAt ?? data.updated_at;
  const displayDate = updatedAt ?? createdAt;
  const topic = data.topic ?? data.type;
  return {
    id: data.id,
    channel: "learning",
    title: data.title,
    content: data.description,
    thumbnailUrl: resolveMediaUrl(data.thumbnailUrl),
    publishedAt: displayDate,
    createdAt,
    updatedAt,
    authorMemberId: data.uploaderMemberId ?? data.uploader_member_id,
    linkUrl: data.linkUrl,
    type: data.type,
    status: data.status,
    topic,
  };
};

export const normalizeFund = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    channel: "donation",
    title: data.name,
    content: data.descriptionFull,
    thumbnailUrl: resolveMediaUrl(data.logoUrl),
    publishedAt: data.timeStarted,
    organizer: data.managerName,
    donationDate: data.timeStarted,
    donationEndDate: data.timeEnded,
    donorCount: data.donorCount ?? 0,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount,
    topic: data.topic,
  };
};
