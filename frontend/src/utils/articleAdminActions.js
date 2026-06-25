export const ARTICLE_DELETE_ENDPOINTS = {
  news: "/articles/news",
  alumni: "/articles/alumni-posts",
  achievement: "/articles/achievements",
  job: "/articles/jobs",
  learning: "/articles/learning-resources",
};

export const getArticleAdminEditPath = (article) => {
  if (!article?.channel || !article?.id) return null;
  return `/admin/article/${article.channel}/${article.id}/edit`;
};

export const getArticleDeleteEndpoint = (article) => {
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
