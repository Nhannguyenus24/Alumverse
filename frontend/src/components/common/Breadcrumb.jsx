import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const Breadcrumb = ({ items = [] }) => {
  const navigate = useNavigate();

  // Maximum 3 levels
  const displayItems = items.slice(-3);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;

        if (isLast || !item.path) {
          return (
            <Typography key={index} color="text.primary">
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={index}
            component="button"
            variant="body2"
            onClick={() => item.path && navigate(item.path)}
            sx={{
              cursor: 'pointer',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default Breadcrumb;