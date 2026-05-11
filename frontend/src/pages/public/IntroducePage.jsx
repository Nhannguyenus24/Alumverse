import { Link } from "react-router";
import { Box, Container, Typography, Button } from "@mui/material";
import Page from "../../components/Page";

const BANNER_IMG = "/home_page/home_page.png";
const LEADERS_IMG = "/cac_the_he_kt_ht.png";

const HISTORY_SECTIONS = [
  {
    title: "Trường Cao đẳng Khoa học",
    paragraphs: [
      "Ngày 26/7/1941, Trường Cao đẳng Khoa học trực thuộc Viện Đại học Đông Dương được thành lập ở Hà Nội. Từ năm 1942, Trường bắt đầu tổ chức kỳ thi nhập học chứng chỉ Toán Đại cương (M.G); Toán, Lý Hóa (M.P.C); Lý, Hóa, Lịch sử tự nhiên (S.P.C.N) tại Hà Nội, Huế, Sài Gòn.",
      "Năm 1947, Trung tâm thứ hai được thiết lập tại Sài Gòn và tọa lạc trên phần đất của bệnh viện Policlinique Dejean de la Ba6tie (nay là Bệnh viện Đa khoa Sài gòn – Đường Lê Lợi), sau đó chuyển về phần đất trên đại lộ Nancy (sau này đổi tên thành Đại lộ Cộng Hòa, nay là 227 Nguyễn Văn Cừ). Năm 1947-1948, Trường tuyển sinh nhiều chứng chỉ như Toán Đại cương, Toán Vi phân và Tích phân, Thực vật Đại cương, Động vật, Sinh lý Đại cương, Vật lý, Hóa học.",
      "Ngày 23/11/1947 thành lập phân ban Vô tuyến điện trực thuộc phòng thí nghiệm Vật lý, đào tạo các cán sự Vô tuyến điện.",
    ],
  },
  {
    title: "Khoa học Đại học đường – Trường Đại học Khoa học Sài Gòn",
    paragraphs: [
      "Ngày 30/12/1949, theo ký kết trong Bản Hiệp ước văn hóa Pháp – Việt, Viện Đại học Đông Dương chuyển đổi thành Viện Đại học hỗn hợp Pháp-Việt, lấy tên là Viện Đại học Hà Nội, gồm 2 trung tâm: một trung tâm ở Hà Nội và một trung tâm ở Sài Gòn. Viện bắt đầu hoạt động từ tháng 01/1951 dưới sự điều hành của Viện trưởng người Pháp và được trợ giúp bởi một Phó Viện trưởng người Việt",
      "Ngày 12/11/1953, một văn bản của hai Chính phủ Pháp và Việt Nam đổi tên trường Cao đẳng Khoa học thành Khoa học Đại học Đường.",
      "Tháng 11/1954, trung tâm ở Hà Nội di chuyển vào nam và sáp nhập với Trung tâm ở Sài Gòn. Ban đầu gồm có các trường: ĐH Luật khoa, ĐH hỗn hợp Y-Dược khoa, ĐH Khoa học, Cao đẳng Kiến trúc, Trường dự bị Văn khoa. Bản Hiệp ước Văn hóa Việt-Pháp (30/12/1949) và sau đó là thỏa thuận bổ sung (08/01/1951) đã quyết định sẽ chuyển giao điều hành từ chính phủ Pháp qua Việt Nam. Ngày 11/5/1955 Lễ chuyển giao từ chính phủ Pháp cho Việt Nam đã được tiến hành. Ngày này trở thành mốc đánh dấu ngày thành lập Viện Đại học Quốc gia Việt Nam. Viện Đại học Quốc gia Việt Nam được đặt dưới sự điều hành của một Viện Trưởng người Việt Nam. Theo Sắc lệnh số 247 ngày 28/4/1955, Ông Nguyễn Quang Trình, Giáo sư thực thụ, Tiến sĩ Khoa học, đã được cử làm Viện trưởng Viện Đại học Quốc gia. Đồng thời, GS Nguyễn Quang Trình được bổ nhiệm là Quyền Khoa Trưởng Khoa học Đại học Đường (tức Trường Đại học Khoa học).",
      "Ngày 22/12/1955 lễ khai giảng các trường Đại học diễn ra sau khi ký kết văn kiện chuyển giao. Sĩ số sinh viên của Trường Đại học Khoa học tính đến ngày 01/01/1956 là 743 sinh viên với 15 Giáo sư (có 7 người Pháp). Các kỳ thi cuối niên học 1955-1956, khóa thứ I (ngày nay gọi là thi lần 1), mở từ ngày 11/6/1956, kết quả số sinh viên thi đạt là 96 trên số sinh viên dự thi là 326. Kỳ thi khóa II, mở ngày 16/10/1956, kết quả số sinh viên thi đạt là 84 trên số sinh viên dự thi là 241.",
      "Tháng 3 năm 1957, sau khi Viện Đại học Huế được thành lập thì Viện Đại học Quốc gia Việt Nam đổi tên thành Viện Đại học Sài Gòn; cũng từ đó trường Đại học Khoa học được mang tên Trường Đại học Khoa học Sài Gòn.",
      "Ngày thứ ba, 13/10/1964, lúc 9g sáng đã diễn ra lễ đặt viên đá đầu tiên xây dựng tòa nhà thuộc Trường Đại học Khoa học Sài Gòn tại khu Đại học Thủ Đức (cơ sở Linh Trung hiện nay), theo chương trình Viện trợ Văn hóa cho Chính phủ Việt Nam của Tân Tây Lan (New Zealand).",
      "Trường Đại học Khoa học Sài Gòn được xem là trường khoa học cơ bản mạnh nhất lúc bấy giờ và là cái nôi nghiên cứu khoa học cơ bản. Trường đào tạo hệ đại học và sau đại học, tổ chức bảo vệ luận án “Tiến sĩ quốc gia” đầu tiên về Hóa học vào năm 1965, từ đó trường tổ chức đào tạo Bằng “Tiến sĩ quốc gia” và “Tiến sĩ Đệ tam cấp” trong các ngành khoa học.",
      "Các vị Khoa trưởng kế nhiệm: GS.TSKH. Nguyễn Quang Trình (1955-1958); GS.TSKH. Lê Văn Thới (1958-1964); GS.TSKH Dương Thị Mai (Mai Trần Ngọc Tiếng) (1964-1965); GS.TSKH. Nguyễn Chung Tú (1966-1973); GS.TSKH. Phùng Trung Ngân (1973-1975)",
      "Tháng 4/1975, miền Nam hoàn toàn giải phóng, Khoa học Đại học Đường đổi tên thành Trường Đại học Khoa học, được điều hành bởi một “Ban phụ trách” do GS.TS Nguyễn Hữu Chí làm Trưởng ban cho đến năm 1977.",
    ],
  },
  {
    title: "Trường Đại học Tổng hợp TP. Hồ Chí Minh",
    paragraphs: [
      "Năm 1977, Trường Đại học Tổng hợp TP. HCM được thành lập dựa trên cơ sở sáp nhập Trường Đại học Khoa học và Đại học Văn khoa. PGS.TS Lý Hòa được Thủ tướng Chính phủ bổ nhiệm giữ chức vụ Hiệu trưởng (1977-1990). Đến năm 1990, GS.TS Nguyễn Ngọc Giao được Bộ Giáo dục & Đào tạo ban hành Quyết định bổ nhiệm Hiệu trưởng (nhiệm kỳ 1990-1994) và tiếp tục đến năm 1996.",
      "Trường gồm 16 khoa: Toán, Vật lý, Hóa, Sinh, Địa lý, Địa chất, Ngữ văn, Sử học, Triết, Kinh tế, Thư viện, Anh, Pháp, Nga, Luật và Đông Phương học. Ngoài ra còn có 7 trung tâm NCKH – dịch vụ và sản xuất.",
      "Ngày 27/1/1995, Đại học Quốc gia Thành phố Hồ Chí Minh (ĐHQG-HCM) được thành lập, Trường Đại học Tổng hợp là thành viên của ĐHQG-HCM.",
      "Trường đóng vai trò lớn trong việc đào tạo hàng ngàn nhà khoa học trẻ trên hai lãnh vực là khoa học tự nhiên và khoa học xã hội. Trường có mối quan hệ với hàng chục trường đại học, viện và tổ chức giáo dục trên thế giới. Từng tổ chức nhiều hội thảo khoa học và cử cán bộ tu nghiệp và trao đổi chuyên môn.",
    ],
  },
  {
    title: "Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM",
    paragraphs: [
      "Trường Đại học Khoa học Tự nhiên được thành lập vào ngày 30/3/1996, trên cơ sở tách ra từ Trường Đại học Tổng hợp TP. HCM và là thành viên của ĐHQG-HCM. GS.TS Nguyễn Văn Đến được bổ nhiệm Hiệu trưởng của Trường (nhiệm kỳ 1996-2000). Từ năm 2001-2010, PGS.TS Dương Ái Phương giữ chức vụ Hiệu trưởng trường. Sau đó, GS. TS Trần Linh Thước là Hiệu trưởng trường trong khoảng thời gian từ 2011-2020.",
      "Kể từ 2021 đến nay, PGS.TS Trần Lê Quan giữ chức vụ Hiệu trưởng.",
    ],
  },
];

const IntroducePage = () => {
  return (
    <Page
      title="Giới thiệu"
      meta={
        <meta
          name="description"
          content="Lịch sử và các thế hệ Khoa trưởng, Hiệu trưởng - Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
        />
      }
    >
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        {/* HERO COVER */}
        <Box
          sx={{
            height: { xs: 260, md: 600 },
            backgroundImage: `url(${BANNER_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* CONTENT WRAPPER */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            mt: { xs: -15, md: -40 }, // overlap lên hero
            mb: 8,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 1200,
              mx: "auto",
              backgroundColor: "#fff",
              borderRadius: 1,
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
              overflow: "hidden",
              py: { xs: 5, md: 6 },
              px: { xs: 5, md: 6 },
            }}
          >
            <Typography
              variant="h1"
              component="h2"
              fontWeight={800}
              color="primary.main"
              textAlign="center"
              sx={{
                mb: 5,
                fontSize: { xs: "1.8rem", md: "2.3rem" },
              }}
            >
              GIỚI THIỆU
            </Typography>

            {HISTORY_SECTIONS.map((section) => (
              <Box key={section.title} sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  component="h3"
                  fontWeight={700}
                  color="primary.main"
                  sx={{ mb: 2, fontSize: "1.1rem" }}
                >
                  {section.title}
                </Typography>
                {section.paragraphs.map((para, i) => (
                  <Typography
                    key={i}
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      lineHeight: 1.8,
                      mb: 1.5,
                      textAlign: "justify",
                    }}
                  >
                    {para}
                  </Typography>
                ))}
              </Box>
            ))}

            {/* Generations of Deans / Rectors */}
            <Box sx={{ mt: 6, mb: 4 }}>
              <Typography
                variant="h6"
                component="h3"
                fontWeight={700}
                color="primary.main"
                textAlign="center"
                sx={{
                  mb: 3,
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                Các thế hệ Khoa trưởng, Hiệu trưởng
              </Typography>
              <Box
                component="img"
                src={LEADERS_IMG}
                alt="Các thế hệ Khoa trưởng, Hiệu trưởng - HCMUS"
                sx={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: 1,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
            </Box>

            {/* CTA: Introduce Faculties */}
            <Box
              sx={{
                textAlign: "center",
                mt: 5,
                py: 3,
                px: 2,
                borderRadius: 2,
              }}
            >
              <Button
                component={Link}
                to="/faculties"
                variant="contained"
                size="large"
                sx={{
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                }}
              >
                Giới thiệu các Khoa
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Page>
  );
};

export default IntroducePage;
