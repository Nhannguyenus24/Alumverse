import { useEffect, useState } from "react";
import { Card, LinearProgress, Pagination, Stack, Typography } from "@mui/material";
import { fundApi } from "../../utils/api";
import DonationListItemCard from "./DonationListItemCard";
import DonationListFilters from "./DonationListFilters";

export default function FundraisingListSection({ fundId }) {
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
        setErrorMessage(error?.response?.data?.message ?? "Không thể tải danh sách lượt quyên góp.");
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
    <Card
      sx={{
        px: { xs: 2.5, md: 4 },
        py: { xs: 3, md: 3.6 },
        mb: 3,
        borderRadius: 2.5,
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 26px rgba(15, 58, 122, 0.08)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f2f5f", fontSize: { xs: "1.35rem", md: "1.6rem" } }}>
          Danh sách
        </Typography>
      </Stack>

      <DonationListFilters
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
      />

      {errorMessage ? (
        <Typography sx={{ color: "#9f2f2f", fontWeight: 700, mb: 2 }}>{errorMessage}</Typography>
      ) : null}

      <Stack spacing={1.5} sx={{ minHeight: { xs: 430, md: 470 } }}>
        {isLoading ? <LinearProgress sx={{ height: 8, borderRadius: 999 }} /> : null}

        {!isLoading && items.length === 0 ? <Typography sx={{ color: "#617491", fontWeight: 600 }}> Không tìm thấy.</Typography> : null}

        {items.map((item) => (
          <DonationListItemCard key={item.id} item={item} />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="center" sx={{ mt: 2.3 }}>
        <Pagination
          count={totalPage}
          page={Math.min(page, totalPage)}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
          size="medium"
          sx={{ "& .MuiPaginationItem-root": { fontWeight: 700 } }}
        />
      </Stack>
    </Card>
  );
}
