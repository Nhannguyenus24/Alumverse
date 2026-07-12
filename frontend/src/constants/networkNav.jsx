
export const getNetworkSidebarItems = (t) => [
  { id: '/network', label: t('network:title'), icon: <SearchIcon /> },
  { id: '/network/requests', label: t('network:connection_request'), icon: <MailOutlineIcon /> },
  { id: '/network/connections', label: t('network:current_connections'), icon: <PeopleIcon /> },
  { id: '/network/restricted-connections', label: t('network:restricted_connections'), icon: <BlockIcon /> },
];
