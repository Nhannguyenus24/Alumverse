import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Container, Stack, Box, Typography, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../components/Page";
import SearchBar from "../../components/SearchBar";
import MyTicketCard from "../../components/MyTicketCard";
import { eventApi } from "../../utils/api";

const useMyTickets = () => {
  return useQuery({
    queryKey: ["myTickets"],
    queryFn: () => eventApi.getMyTickets({ page: 0, limit: 100 }),
    select: (data) => data?.items ?? [],
  });
};

const MyTicketsPage = () => {
  const { t } = useTranslation(["event"]);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const highlightCode = searchParams.get("ticket");
  const scrolledRef = useRef(false);
  const queryClient = useQueryClient();
  const { data: tickets = [], isPending, isError } = useMyTickets();

  useEffect(() => {
    if (!highlightCode || scrolledRef.current || isPending) return;
    const el = document.getElementById(`ticket-${highlightCode}`);
    if (el) {
      scrolledRef.current = true;
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, [highlightCode, isPending, tickets]);

  const filtered = tickets.filter((t) =>
    (t.eventTitle ?? t.ticketCode ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelled = () => {
    queryClient.invalidateQueries({ queryKey: ["myTickets"] });
  };

  return (
    <Page title={t("event:my_tickets")}>
      <Container
        maxWidth="lg"
        sx={{
          pt: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 4, md: 8 },
          px: { xs: 2, sm: 3, lg: 6 },
        }}
      >
        <Stack spacing={3}>
          <Stack gap={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" } }}
              >
                {t("event:my_tickets").toUpperCase()}
              </Typography>
            </Box>

            <SearchBar value={search} onChange={setSearch} />
          </Stack>

          {isPending && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Typography color="text.secondary" textAlign="center">
              {t("event:error_load_tickets")}
            </Typography>
          )}

          {!isPending && !isError && filtered.length === 0 && (
            <Typography color="text.secondary" textAlign="center">
              {t("event:no_tickets")}
            </Typography>
          )}

          <Stack spacing={2}>
            {filtered.map((ticket) => (
              <MyTicketCard
                key={ticket.id}
                ticket={ticket}
                highlighted={highlightCode === ticket.ticketCode}
                onCancelled={handleCancelled}
              />
            ))}
          </Stack>
        </Stack>
      </Container>
    </Page>
  );
};

export default MyTicketsPage;
