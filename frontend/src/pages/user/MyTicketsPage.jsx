import { useState } from "react";
import {
  Container,
  Stack,
  Box,
  Typography,
} from "@mui/material";

import Page from "../../components/Page";
import SearchBar from "../../components/SearchBar";
import MyTicketCard from "../../components/MyTicketCard";

const mockTickets = [
  {
    id: 1,
    date: "20/06/2026",
    title: "Alumni Networking Night 2026",
    organizer: "HCMUS Alumni Association",
    participants: 250,
    interested: 430,
    status: "upcoming",
  },
  {
    id: 2,
    date: "05/05/2026",
    title: "Career Talk: AI & Data Science",
    organizer: "Faculty of IT",
    participants: 180,
    interested: 350,
    status: "attended",
  },
  {
    id: 3,
    date: "12/03/2026",
    title: "Spring Alumni Meetup",
    organizer: "HCMUS",
    participants: 120,
    interested: 210,
    status: "finished",
  },
];

const MyTicketsPage = () => {
  const [filters, setFilters] = useState({
    search: "",
  });

  const filteredTickets = mockTickets.filter((ticket) =>
    ticket.title
      .toLowerCase()
      .includes(filters.search.toLowerCase())
  );

  return (
    <Page title="Vé của tôi">
      <Container
        maxWidth="lg"
        sx={{
          pt: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 4, md: 8 },
          px: { xs: 2, sm: 3, lg: 6 },
        }}
      >
        <Stack spacing={3}>
          {/* HEADER */}
          <Stack gap={2}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{
                  fontSize: {
                    xs: "1.8rem",
                    md: "2.3rem",
                  },
                }}
              >
                VÉ CỦA TÔI
              </Typography>
            </Box>

            {/* SEARCH */}
            <SearchBar
              value={filters.search}
              onChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  search: val,
                }))
              }
            />
          </Stack>

          {/* TICKETS */}
          <Stack spacing={2}>
            {filteredTickets.map((ticket) => (
              <MyTicketCard
                key={ticket.id}
                ticket={ticket}
                onViewTicket={() => {
                  console.log("View ticket", ticket.id);
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Container>
    </Page>
  );
};

export default MyTicketsPage;