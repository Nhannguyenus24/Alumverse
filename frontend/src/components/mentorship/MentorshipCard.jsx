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

  const stopCardClick = (handler) => (event) => {
    event.stopPropagation();
    handler?.(event);
  };

  const bookButton = (
    <Button
      variant="contained"
      fullWidth
      disabled={!canBook}
      onClick={canBook ? stopCardClick(onBook) : stopCardClick()}
      sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
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
        height: "100%",
        cursor: onViewProfile ? "pointer" : "default",
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)" },
      }}
      onClick={onViewProfile}
    >
      <Stack spacing={2} alignItems="center">
        <Avatar src={avatar} sx={{ width: 80, height: 80 }} />

        <Box sx={{ minHeight: 54 }}>
          <Typography fontWeight={700} variant="subtitle1" noWrap>
            {name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
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
            alignContent: "flex-start",
            gap: 1,
            minHeight: 84,
            maxHeight: 84,
            overflow: "hidden",
          }}
        >
          {tags.map((tag, idx) => (
            <MentorshipTag key={idx} label={tag} />
          ))}
        </Box>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 1, mt: 3, width: "100%" }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={stopCardClick(onViewProfile)}
          sx={{ minWidth: 0, width: "100%", whiteSpace: "nowrap" }}
        >
          {t('profile')}
        </Button>
        {!canBook && bookDisabledReason ? (
          <Tooltip title={bookDisabledReason}>
            <Box onClick={(event) => event.stopPropagation()} sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
              {bookButton}
            </Box>
          </Tooltip>
        ) : (
          <Box onClick={(event) => event.stopPropagation()} sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
            {bookButton}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default MentorshipCard;
