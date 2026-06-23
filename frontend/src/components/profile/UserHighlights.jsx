import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArticleIcon from '@mui/icons-material/Article';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';

import { useUserAlumniPosts } from '../../hooks/articles/useUserAlumniPosts';
import { useUserDonations } from '../../hooks/fundraising/useUserDonations';
import { formatDate } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/numberFormatter';

const UserHighlights = ({ userId, navigate }) => {
  const { t } = useTranslation(['profile']);
  const articlesQuery = useUserAlumniPosts(userId, 0, 5, { enabled: Boolean(userId) });
  const donationsQuery = useUserDonations(userId, 0, 5, { enabled: Boolean(userId) });

  const articles = useMemo(() => articlesQuery.data?.items ?? [], [articlesQuery.data]);
  const donations = useMemo(() => donationsQuery.data?.items ?? [], [donationsQuery.data]);

  if (!userId || (articles.length === 0 && donations.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h4" fontWeight={800} color="primary.main" mb={4} textAlign="center" textTransform="uppercase">
        {t('profile:highlights_title')}
      </Typography>

      <Grid container spacing={4}>
        {articles.length > 0 && (
          <Grid item xs={12} md={donations.length > 0 ? 6 : 12}>
            <Typography variant="h6" fontWeight={700} color="text.primary" mb={2} display="flex" alignItems="center" gap={1}>
              <ArticleIcon color="primary" /> {t('profile:posted_articles')}
            </Typography>
            <Stack spacing={2}>
              {articles.map((article) => (
                <Card key={article.id} sx={{ borderRadius: 2, boxShadow: '0 2px 10px 0 rgba(0,0,0,0.04)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px 0 rgba(0,0,0,0.08)' } }}>
                  <CardActionArea onClick={() => navigate(`/article/alumni/${article.slug || article.id}`)} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {article.thumbnailUrl && (
                      <Box
                        component="img"
                        src={article.thumbnailUrl}
                        sx={{ width: 80, height: 80, borderRadius: 1.5, objectFit: 'cover', mr: 2 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {article.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {formatDate(article.publishedAt)}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Grid>
        )}

        {donations.length > 0 && (
          <Grid item xs={12} md={articles.length > 0 ? 6 : 12}>
            <Typography variant="h6" fontWeight={700} color="text.primary" mb={2} display="flex" alignItems="center" gap={1}>
              <VolunteerActivismIcon color="error" /> {t('profile:donation_history')}
            </Typography>
            <Stack spacing={2}>
              {donations.map((donation) => (
                <Card key={donation.id} sx={{ borderRadius: 2, boxShadow: '0 2px 10px 0 rgba(0,0,0,0.04)', bgcolor: 'background.paper', borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                          {t('profile:donation_to_fund', { fundId: donation.fundId })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {formatDate(donation.createdAt)}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={800} color="error.main">
                        +{formatCurrency(donation.amount)}
                      </Typography>
                    </Box>
                    {donation.message && (
                      <Typography variant="body2" sx={{ mt: 1, p: 1.5, bgcolor: (theme) => alpha(theme.palette.error.main, 0.05), borderRadius: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                        "{donation.message}"
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default UserHighlights;
