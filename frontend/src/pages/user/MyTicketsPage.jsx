import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { eventApi } from "../../utils/api";
import useOrganizationStore from "../../stores/organizationStore";



const useMyTickets = () => {
  return useQuery({
    queryKey: ["myTickets"],
    queryFn: () => eventApi.getMyTickets({ page: 0, limit: 100 }),
    select: (data) => data?.items ?? [],
  });
};

const getTicketEventTitle = (ticket) =>
  ticket?.eventTitle
  ?? ticket?.eventName
  ?? ticket?.event?.title
  ?? ticket?.title
  ?? null;

const getTicketOrganizer = (ticket) =>
  ticket?.organizer
  ?? ticket?.organizationName
  ?? ticket?.event?.organizer
  ?? ticket?.event?.organizationName
  ?? null;

const getOrganizationLabel = (organization) =>
  organization?.name
  ?? organization?.departmentName
  ?? null;

const MyTicketsPage = () => {
  const { t } = useTranslation(["event"]);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const highlightCode = searchParams.get("ticket");
  const scrolledRef = useRef(false);
  const queryClient = useQueryClient();
  const { data: tickets = [], isPending, isError } = useMyTickets();
  const organization = useOrganizationStore((state) => state.organization);
  const organizationLabel = getOrganizationLabel(organization);
  const missingEventIds = useMemo(
    () => [...new Set(tickets
      .filter((ticket) => ticket?.eventId && (!getTicketEventTitle(ticket) || !getTicketOrganizer(ticket)))
      .map((ticket) => ticket.eventId))],
    [tickets],
  );
  const eventDetailQueries = useQueries({
    queries: missingEventIds.map((eventId) => ({
      queryKey: ["event", eventId, "ticket-detail"],
      queryFn: () => eventApi.getEventById(eventId),
      enabled: Boolean(eventId),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const eventDetailById = useMemo(() => {
    const entries = missingEventIds.map((eventId, index) => {
      const event = eventDetailQueries[index]?.data;
      return [String(eventId), event || null];
    });
    return new Map(entries.filter(([, event]) => Boolean(event)));
  }, [eventDetailQueries, missingEventIds]);
  const enrichedTickets = useMemo(
    () => tickets.map((ticket) => {
      if (!ticket?.eventId) {
        return getTicketOrganizer(ticket) || !organizationLabel
          ? ticket
          : { ...ticket, organizer: organizationLabel };
      }

      const event = eventDetailById.get(String(ticket.eventId));
      const eventTitle = getTicketEventTitle(ticket) ?? event?.title ?? null;
      const organizer = getTicketOrganizer(ticket)
        ?? event?.organizer
        ?? event?.organizationName
        ?? organizationLabel
        ?? null;

      if (eventTitle === getTicketEventTitle(ticket) && organizer === getTicketOrganizer(ticket)) {
        return ticket;
      }

      return {
        ...ticket,
        ...(eventTitle ? { eventTitle } : {}),
        ...(organizer ? { organizer } : {}),
      };
    }),
    [eventDetailById, organizationLabel, tickets],
  );

  useEffect(() => {
    if (!highlightCode || scrolledRef.current || isPending) return;
    const el = document.getElementById(`ticket-${highlightCode}`);
    if (el) {
      scrolledRef.current = true;
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, [highlightCode, isPending, enrichedTickets]);

  const filtered = enrichedTickets.filter((ticket) =>
    (getTicketEventTitle(ticket) ?? ticket.ticketCode ?? "").toLowerCase().includes(search.toLowerCase())
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
          <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ScrollRevealItem sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" } }}
              >
                {t("event:my_tickets").toUpperCase()}
              </Typography>
            </ScrollRevealItem>

            <ScrollRevealItem><SearchBar value={search} onChange={setSearch} /></ScrollRevealItem>
          </ScrollRevealGroup>

          {isPending && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <LoadingSkeleton />
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

          <ScrollRevealGroup stagger={0.07} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((ticket) => (
              <ScrollRevealItem key={ticket.id}><MyTicketCard
                ticket={ticket}
                highlighted={highlightCode === ticket.ticketCode}
                onCancelled={handleCancelled}
              /></ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </Stack>
      </Container>
    </Page>
  );
};

export default MyTicketsPage;
