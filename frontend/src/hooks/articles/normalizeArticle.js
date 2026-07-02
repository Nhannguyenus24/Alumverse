export const normalizeNews = (data) => {
  if (!data) return null;
  const publishedAt = data.publishedAt ?? data.published_at ?? data.createdAt ?? data.created_at;
  return {
    id: data.id,
    channel: "news",
    title: data.title,
    content: data.content,
    thumbnailUrl: data.thumbnailUrl,
    publishedAt,
    topic: data.topic,
  };
};

export const normalizeAlumniPost = (data) => {
  if (!data) return null;
  const publishedAt = data.publishedAt ?? data.published_at ?? data.createdAt ?? data.created_at;
  return {
    id: data.id,
    channel: "alumni",
    title: data.title,
    content: data.content,
    thumbnailUrl: data.thumbnailUrl,
    publishedAt,
    topic: data.topic,
  };
};

export const normalizeEvent = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    channel: "event",
    title: data.title,
    content: data.description,
    thumbnailUrl: data.bannerUrl,
    publishedAt: data.createdAt,
    organizer: data.organizer ?? null,
    eventDate: data.startTime,
    eventEndDate: data.endTime,
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
  const publishedAt = data.createdAt ?? data.created_at;
  return {
    id: data.id,
    channel: "job",
    title: data.title,
    content: data.description,
    thumbnailUrl: null,
    publishedAt,
    companyName: data.companyName,
    location: data.location,
    salaryRange: data.salaryRange,
    deadline: data.deadline,
    howToApply: data.howToApply,
    type: data.type,
  };
};

export const normalizeAchievement = (data) => {
  if (!data) return null;
  const publishedAt = data.awardedDate ?? data.awarded_date ?? data.createdAt ?? data.created_at;
  return {
    id: data.id,
    channel: "achievement",
    title: data.title,
    content: data.description,
    thumbnailUrl: data.imageUrl,
    publishedAt,
    status: data.status,
    topic: data.topic,
    memberName: data.memberName,
    memberAvatar: data.memberAvatar,
    memberJobTitle: data.memberJobTitle,
    memberCompany: data.memberCompany,
  };
};

export const normalizeLearning = (data) => {
  if (!data) return null;
  const publishedAt = data.createdAt ?? data.created_at;
  return {
    id: data.id,
    channel: "learning",
    title: data.title,
    content: data.description,
    thumbnailUrl: null,
    publishedAt,
    linkUrl: data.linkUrl,
    type: data.type,
  };
};

export const normalizeFund = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    channel: "donation",
    title: data.name,
    content: data.descriptionFull,
    thumbnailUrl: data.logoUrl,
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
