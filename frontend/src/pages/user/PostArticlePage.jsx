import { useState } from 'react';
import PostArticleForm from '../../components/PostArticleForm';
import PostArticleShell from '../../components/PostArticleShell';
import useCoverUpload from '../../hooks/useCoverUpload';
import { useCreateNews } from '../../hooks/news/useCreateNews';
import { fileToBase64 } from '../../utils/imageUtils';
import { useNotification } from '../../hooks/useNotification';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const PostArticlePage = () => {
  const navigate = useOrgNavigate();
  const { showSuccess, showError } = useNotification();
  const { createNews, isPending } = useCreateNews();
  const { coverFile, coverPreview, handleCoverUpload } = useCoverUpload();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      showError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    try {
      const thumbnailBase64 = coverFile ? await fileToBase64(coverFile) : null;
      const payload = {
        title: title.trim(),
        content: content.trim(),
        thumbnailBase64,
        url: url.trim() || null,
      };

      const result = await createNews(payload);
      showSuccess('Bài viết đã được đăng thành công!');
      navigate(`/article/news/${result.id}`);
    } catch (err) {
      showError(err.response?.data?.message ?? 'Đăng bài thất bại');
    }
  };

  return (
    <PostArticleShell
      pageTitle="Đăng bài tin tức"
      coverPreview={coverPreview}
      onCoverChange={handleCoverUpload}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isPending={isPending}
    >
      <PostArticleForm
        channel="news"
        channelLabel="Tin tức"
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        topic={topic}
        setTopic={setTopic}
        url={url}
        setUrl={setUrl}
      />
    </PostArticleShell>
  );
};

export default PostArticlePage;
