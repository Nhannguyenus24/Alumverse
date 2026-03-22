import { Link } from "react-router";
import { Box, Container, Typography } from "@mui/material";
import Page from "../components/Page";

const BANNER_BLUE = "#012B59";

const FACULTIES = [
  {
    type: "KHOA",
    name: "CÔNG NGHỆ THÔNG TIN",
    logo: "/faculty_logo/cntt.png",
    truongKhoa: "TS. Đình Bá Tiến",
    phoTruongKhoa: "PGS.TS. Nguyễn Văn Vũ, TS. Lâm Quang Vũ",
    to: "/faculties/information-technology",
  },
  {
    type: "KHOA",
    name: "VẬT LÝ - VẬT LÝ KỸ THUẬT",
    logo: "/faculty_logo/vat_li.png",
    truongKhoa: "PGS. TS. Huỳnh Văn Tuấn",
    phoTruongKhoa: "PGS. TS. Trần Thiện Thanh",
    to: "#",
  },
  {
    type: "KHOA",
    name: "ĐỊA CHẤT",
    logo: "/faculty_logo/dia_chat.png",
    truongKhoa: "PGS. TS. Phạm Trung Hiếu",
    phoTruongKhoa: "",
    to: "#",
  },
  {
    type: "KHOA",
    name: "TOÁN - TIN HỌC",
    logo: "/faculty_logo/toan_tin.png",
    truongKhoa: "PGS. TS. Mai Hoàng Biên",
    phoTruongKhoa: "TS. Hoàng Văn Hà, ThS. Võ Đức Cẩm Hài",
    to: "#",
  },
  {
    type: "KHOA",
    name: "ĐIỆN TỬ - VIỄN THÔNG",
    logo: "/faculty_logo/dtvt.png",
    truongKhoa: "TS. Bùi Trọng Tú",
    phoTruongKhoa: "TS. Đặng Lê Khoa, ThS. Cao Trần Bảo Thương",
    to: "#",
  },
  {
    type: "KHOA",
    name: "KHOA HỌC & CÔNG NGHỆ VẬT LIỆU",
    logo: "/faculty_logo/vat_lieu.png",
    truongKhoa: "PGS.TS. Trần Thị Thanh Vân",
    phoTruongKhoa: "PGS. TS. Hà Thúc Chỉ Nhân",
    to: "#",
  },
  {
    type: "KHOA",
    name: "HÓA HỌC",
    logo: "/faculty_logo/hoa_hoc.png",
    truongKhoa: "PGS.TS. Nguyễn Trung Nhân",
    phoTruongKhoa: "PGS.TS. Nguyễn Công Tránh, ThS. Nguyễn Thu Hương",
    to: "#",
  },
  {
    type: "KHOA",
    name: "SINH HỌC - CÔNG NGHỆ SINH HỌC",
    logo: "/faculty_logo/sinh_hoc.png",
    truongKhoa: "PGS.TS. Quách Ngô Diễm Phương",
    phoTruongKhoa: "PGS. TS. Trương Hải Nhung",
    to: "#",
  },
  {
    type: "KHOA",
    name: "MÔI TRƯỜNG",
    logo: "/faculty_logo/moi_truong.png",
    truongKhoa: "PGS. TS. Đào Nguyên Khôi",
    phoTruongKhoa: "TS. Lê Hoàng Anh",
    to: "#",
  },
  {
    type: "KHOA",
    name: "KHOA HỌC LIÊN NGÀNH",
    logo: "/faculty_logo/khoa_hoc_lien_nganh.png",
    truongKhoa: "PGS.TS. Nguyễn Tuyết Phương",
    phoTruongKhoa: "",
    to: "#",
  },
  {
    type: "VIỆN",
    name: "TẾ BÀO GỐC",
    logo: "/faculty_logo/vien_te_bao_goc.png",
    truongKhoa: "PGS.TS. Phạm Vân Phúc",
    phoTruongKhoa: "",
    to: "#",
  },
];

const FacultiesPage = () => {
  return (
    <Page
      title="Các Khoa"
      meta={
        <meta
          name="description"
          content="Các Khoa - Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
        />
      }
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          px: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            backgroundColor: BANNER_BLUE,
            py: { xs: 3, md: 4 },
            width: "100%",
          }}
        >
          <Typography
            variant="h1"
            component="h2"
            sx={{
              color: "#fff",
              fontWeight: 700,
              textAlign: "center",
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
              textTransform: "uppercase",
            }}
          >
            CÁC KHOA
          </Typography>
        </Box>

        <Container
          maxWidth="lg"
          sx={{
            py: 4,
            px: { xs: 2, sm: 3 },
          }}
        >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            gap: 3,
            "& > *": {
              flex: "0 1 calc(25% - 18px)",
              minWidth: 220,
              "@media (max-width: 900px)": {
                flex: "0 1 calc(50% - 12px)",
              },
              "@media (max-width: 500px)": {
                flex: "1 1 100%",
              },
            },
          }}
        >
          {FACULTIES.map((faculty) => (
            <Box
              key={faculty.name}
              component={Link}
              to={faculty.to}
              sx={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
                height: 280,
                flexShrink: 0,
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
              }}
            >
                <Box
                  component="img"
                  src={faculty.logo}
                  alt={faculty.name}
                  sx={{
                    objectFit: "contain",
                  }}
                />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                  gap: 0.5,
                  p: 2,
                  pt: 1,
                  overflow: "auto",
                }}
              >
                <Typography sx={{ fontSize: "0.8rem" }}>
                  {faculty.type === "VIỆN" ? "Viện trưởng:" : "Trưởng khoa:"}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>
                  {faculty.truongKhoa}
                </Typography>
                {faculty.phoTruongKhoa && (
                  <>
                    <Typography sx={{ fontSize: "0.8rem", mt: 0.5 }}>
                      {faculty.type === "VIỆN"
                        ? "Phó Viện trưởng:"
                        : "Phó Trưởng khoa:"}
                    </Typography>
                    {faculty.phoTruongKhoa.split(",").map((name, i) => (
                      <Typography
                        key={i}
                        sx={{ fontSize: "0.8rem", fontWeight: 700, pl: 1.5 }}
                      >
                        • {name.trim()}
                      </Typography>
                    ))}
                  </>
                )}
              </Box>
            </Box>
          ))}
        </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default FacultiesPage;
