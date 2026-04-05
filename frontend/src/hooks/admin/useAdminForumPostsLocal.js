import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_FORUM_POSTS } from '../../constants/adminDefaultForumPosts';

const useAdminForumPostsLocal = () => {
  const [posts, setPosts] = useState(() => DEFAULT_FORUM_POSTS.map((p) => ({ ...p })));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (statusFilter !== 'ALL') {
      list = list.filter((post) => post.moderationStatus === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((post) => {
        const haystack = [post.topicTitle, post.authorName, post.content, String(post.id)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [posts, statusFilter, search]);

  const updatePostStatus = useCallback((id, moderationStatus) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, moderationStatus } : post)),
    );
  }, []);

  const deletePost = useCallback((id) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  return {
    allPosts: posts,
    posts: filteredPosts,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    updatePostStatus,
    deletePost,
  };
};

export default useAdminForumPostsLocal;
