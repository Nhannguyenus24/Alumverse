export const normalizeNews = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    channel: "news",
    title: data.title,
    content: data.content,
    thumbnailUrl: data.thumbnailUrl,
    publishedAt: data.publishedAt,
  };
};

export const normalizeAlumniPost = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    channel: "alumni",
    title: data.title,
    content: data.content,
    thumbnailUrl: data.thumbnailUrl,
    publishedAt: data.publishedAt,
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
    maxCapacity: data.maxCapacity,
  };
};

export const normalizeJob = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    channel: "job",
    title: data.title,
    content: data.description,
    thumbnailUrl: null,
    publishedAt: data.createdAt,
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
  return {
    id: data.id,
    channel: "achievement",
    title: data.title,
    content: data.description,
    thumbnailUrl: data.imageUrl,
    publishedAt: data.awardedDate,
    status: data.status,
  };
};

export const normalizeLearning = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    channel: "learning",
    title: data.title,
    content: data.description,
    thumbnailUrl: null,
    publishedAt: data.createdAt,
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
  };
};
