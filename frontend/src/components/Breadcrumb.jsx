import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const Breadcrumb = ({ items = [], uppercase = false, color = 'text', fontSize }) => {
  const navigate = useNavigate();

  // Maximum 3 levels
  const displayItems = items.slice(-3);
  const isPrimary = color === 'primary';
  const textColor = isPrimary ? 'primary.main' : 'text.primary';
  const linkColor = isPrimary ? 'primary.main' : 'inherit';

  if (displayItems.length === 0) {
    return null;
  }

  const typographySx = {
    ...(uppercase && { textTransform: 'uppercase' }),
    color: textColor,
    ...(fontSize && { fontSize }),
  };

  const linkSx = {
    cursor: 'pointer',
    textDecoration: 'none',
    color: linkColor,
    ...(uppercase && { textTransform: 'uppercase' }),
    ...(fontSize && { fontSize }),
    '&:hover': {
      textDecoration: 'underline',
    },
  };

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: isPrimary ? 'primary.main' : undefined } }}
    >
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;

        if (isLast || !item.path) {
          return (
            <Typography key={index} variant="caption" sx={typographySx}>
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={index}
            component="button"
            variant="caption"
            onClick={() => item.path && navigate(item.path)}
            sx={linkSx}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default Breadcrumb;
