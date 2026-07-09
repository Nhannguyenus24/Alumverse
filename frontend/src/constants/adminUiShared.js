const ADMIN_FILTER_BAR_SX = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  flexWrap: 'wrap',
  gap: 2,
  mb: 2,
  alignItems: { xs: 'stretch', md: 'center' },
};

const ADMIN_PRIMARY_ACTION_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 700,
};

export const ADMIN_STATUS_CHIP_SX = {
  fontWeight: 600,
  minWidth: 110,
  justifyContent: 'center',
};

const formatStatusLabel = (status) =>
  (() => {
    const label = String(status || '').replace(/_/g, ' ').trim().toLowerCase();
    return label.charAt(0).toUpperCase() + label.slice(1);
  })();
