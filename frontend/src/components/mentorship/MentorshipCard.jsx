import { Avatar, Box, Button, Card, Stack, Tooltip, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import MentorshipTag from "./MentorshipTag";

const MentorshipCard = ({
  avatar,
  name,
  role,
  rating,
  reviews,
  tags = [],
  onViewProfile,
  onBook,
  canBook = true,
  bookDisabledReason,
}) => {
  const { t } = useTranslation('mentorship');
  const bookButton = (
    <Button
      variant="contained"
      fullWidth
      disabled={!canBook}
      onClick={canBook ? onBook : undefined}
    >
      {t('book_slot')}
    </Button>
  );

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)" },
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Avatar src={avatar} sx={{ width: 80, height: 80 }} />

        <Box>
          <Typography fontWeight={700} variant="subtitle1">
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {role}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <StarIcon sx={{ color: "warning.main", fontSize: 18 }} />
          <Typography fontWeight={700} color="primary.main">
            {rating}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({reviews} reviews)
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {tags.map((tag, idx) => (
            <MentorshipTag key={idx} label={tag} />
          ))}
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onViewProfile}
          sx={{ flex: 1 }}
        >
          {t('profile')}
        </Button>
        {!canBook && bookDisabledReason ? (
          <Tooltip title={bookDisabledReason}>
            <Box sx={{ flex: 1, display: 'flex', minWidth: 0 }}>{bookButton}</Box>
          </Tooltip>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', minWidth: 0 }}>{bookButton}</Box>
        )}
      </Stack>
    </Card>
  );
};

export default MentorshipCard;
