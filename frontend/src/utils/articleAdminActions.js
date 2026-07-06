const ARTICLE_DELETE_ENDPOINTS = {
  news: "/articles/news",
  alumni: "/articles/alumni-posts",
  achievement: "/articles/achievements",
  job: "/articles/jobs",
  learning: "/articles/learning-resources",
};

const ARTICLE_VISIBILITY_ACTIONS = {
  news: {
    publish: (id) => `/articles/news/${id}/publish`,
    unpublish: (id) => `/articles/news/${id}/hide`,
  },
  alumni: {
    publish: (id) => `/articles/alumni-posts/${id}/publish`,
    unpublish: (id) => `/articles/alumni-posts/${id}/hide`,
  },
  job: {
    publish: (id) => `/articles/jobs/${id}/activate`,
    unpublish: (id) => `/articles/jobs/${id}/deactivate`,
  },
  achievement: {
    publish: (id) => `/admin/articles/achievements/${id}/approve`,
    unpublish: (id) => `/admin/articles/achievements/${id}/reject`,
  },
};

export const getArticleAdminEditPath = (article) => {
  if (!article?.channel || !article?.id) return null;
  return `/admin/article/${article.channel}/${article.id}/edit`;
};

const getArticleDeleteEndpoint = (article) => {
  const base = ARTICLE_DELETE_ENDPOINTS[article?.channel];
  if (!base || !article?.id) return null;
  return `${base}/${article.id}`;
};

export const deleteArticleByChannel = (apiClient, article) => {
  const endpoint = getArticleDeleteEndpoint(article);
  if (!endpoint) {
    return Promise.reject(new Error("Unsupported article channel"));
  }
  return apiClient.delete(endpoint);
};

export const getArticleVisibilityState = (article) => {
  if (!article) return null;
  if (article.channel === 'news' || article.channel === 'alumni') {
    return article.isHidden ? 'hidden' : 'published';
  }
  if (article.channel === 'job') {
    return article.isActive ? 'published' : 'hidden';
  }
  if (article.channel === 'achievement') {
    if (article.status === 'APPROVED') return 'published';
    if (article.status === 'REJECTED') return 'rejected';
    return 'hidden';
  }
  return 'published';
};

export const canToggleArticleVisibility = (article) =>
  Boolean(ARTICLE_VISIBILITY_ACTIONS[article?.channel]?.publish && article?.id);

export const toggleArticleVisibility = (apiClient, article) => {
  const actions = ARTICLE_VISIBILITY_ACTIONS[article?.channel];
  if (!actions || !article?.id) {
    return Promise.reject(new Error("Unsupported article channel"));
  }

  const currentState = getArticleVisibilityState(article);
  const endpoint = currentState === 'published'
    ? actions.unpublish(article.id)
    : actions.publish(article.id);
  return apiClient.post(endpoint);
};
