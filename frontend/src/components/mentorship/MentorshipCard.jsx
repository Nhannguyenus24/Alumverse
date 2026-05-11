import { Avatar, Box, Button, Card, Stack, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import MentorshipTag from "./MentorshipTag";

const MentorshipCard = ({
  avatar,
  name,
  role,
  rating,
  reviews,
  tags = [],
  onViewProfile,
}) => {
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

        {/* Rating */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <StarIcon sx={{ color: "warning.main", fontSize: 18 }} />
          <Typography fontWeight={700} color="primary.main">
            {rating}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({reviews} reviews)
          </Typography>
        </Box>

        {/* Tags */}
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

      <Button variant="contained" sx={{ mt: 3 }} fullWidth onClick={onViewProfile}>
        Xem Profile
      </Button>
    </Card>
  );
};

export default MentorshipCard;