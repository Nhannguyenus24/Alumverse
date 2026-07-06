export const getMainNavItems = (t) => [
  {
    label: t('nav:introduction'),
    href: '/introduction',
    children: [
      { label: t('nav:intro_general'), href: '/introduction' },
      { label: t('nav:intro_leaders'), href: '/introduction/leaders' },
      { label: t('nav:intro_team'), href: '/introduction/team' },
    ],
  },
  {
    label: t('nav:network'),
    href: '/network',
    hideChildrenWhenGuest: true,
    children: [
      { label: t('nav:network_requests'), href: '/network/requests', requiresAuth: true },
      { label: t('nav:network_connections'), href: '/network/connections', requiresAuth: true },
      { label: t('nav:network_restricted'), href: '/network/restricted-connections', requiresAuth: true },
    ],
  },
  {
    label: t('nav:honors'),
    href: '/honors',
    children: [
      { label: t('nav:honors_alumni'), href: '/honors/alumni' },
      { label: t('nav:honors_achievements'), href: '/honors/achievements' },
    ],
  },
  { label: t('nav:news'), href: '/news' },
  { label: t('nav:events'), href: '/events' },
  {
    label: t('nav:development'),
    href: '/development',
    children: [
      { label: t('nav:academics'), href: '/development/academics' },
      { label: t('nav:jobs'), href: '/development/jobs' },
    ],
  },
  { label: t('nav:mentorship'), href: '/mentorship' },
  { label: t('nav:forum'), href: '/forum' },
  { label: t('nav:donation'), href: '/donations' },
];
