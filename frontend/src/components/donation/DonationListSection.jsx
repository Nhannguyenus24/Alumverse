import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fundApi } from "../../utils/api";



export default function FundraisingListSection({ fundId }) {
  const { t } = useTranslation('donation');
  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchBy, setSearchBy] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const pageSize = 4;

  useEffect(() => {
    if (!fundId) return;

    let ignore = false;
    const fetchDonations = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const normalizedKeyword = searchKeyword.trim();
        const params = {
          page: Math.max(0, page - 1),
          limit: pageSize,
        };

        if (normalizedKeyword) {
          params.searchBy = searchBy;
          params.keyword = normalizedKeyword;
        }

        const response = await fundApi.getFundDonationsByFundId(fundId, params);
        if (ignore) return;
        setItems(response?.items ?? []);
        setTotalPage(Math.max(1, response?.totalPage ?? 1));
      } catch (error) {
        if (ignore) return;
        setItems([]);
        setTotalPage(1);
        setErrorMessage(error?.response?.data?.message ?? t('donation:error_load_donations'));
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchDonations();

    return () => {
      ignore = true;
    };
  }, [fundId, page, pageSize, searchKeyword, searchBy]);

  return (
    <ScrollRevealGroup
      stagger={0.08}
      sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3, md: 3.6 }, mb: 3, bgcolor: 'background.paper', color: 'text.primary', overflow: 'hidden', border: "1px solid", borderColor: "divider", borderRadius: 1 }}
    >
      <ScrollRevealItem>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", fontSize: { xs: "1.35rem", md: "1.6rem" } }}>
          {t('donation:list_title')}
        </Typography>
      </Stack>
      </ScrollRevealItem>

      <ScrollRevealItem><DonationListFilters
        searchBy={searchBy}
        searchInput={searchInput}
        onSearchByChange={(nextSearchBy) => {
          setSearchBy(nextSearchBy);
          setPage(1);
          setSearchKeyword(searchInput.trim());
        }}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={() => {
          setPage(1);
          setSearchKeyword(searchInput.trim());
        }}
      /></ScrollRevealItem>

      {errorMessage ? (
        <ScrollRevealItem><Typography sx={{ color: "error.main", fontWeight: 700, mb: 2 }}>{errorMessage}</Typography></ScrollRevealItem>
      ) : null}

      <ScrollRevealGroup stagger={0.07} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: { xs: 430, md: 470 } }}>
        {isLoading ? <LinearProgress sx={{ height: 8, borderRadius: 999 }} /> : null}

        {!isLoading && items.length === 0 ? <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>{t('donation:no_donations_found')}</Typography> : null}

        {items.map((item) => (
          <ScrollRevealItem key={item.id}><DonationListItemCard item={item} /></ScrollRevealItem>
        ))}
      </ScrollRevealGroup>

      <ScrollRevealItem><Stack direction="row" justifyContent="center" sx={{ mt: 2.3 }}>
        <Pagination
          count={totalPage}
          page={Math.min(page, totalPage)}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
          size="medium"
          sx={{ "& .MuiPaginationItem-root": { fontWeight: 700 } }}
        />
      </Stack></ScrollRevealItem>
    </ScrollRevealGroup>
  );
}
