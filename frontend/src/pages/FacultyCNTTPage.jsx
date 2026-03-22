import { Box, Container, Typography } from "@mui/material";
import Page from "../components/Page";

const BANNER_IMG = "/faculty_img/cntt.png";
const BANNER_BLUE = "#012B59";

const INTRO_BULLETS = [
  "Khoa học máy tính",
  "Công nghệ phần mềm",
  "Hệ thống thông tin",
  "Mạng máy tính và viễn thông",
  "Công nghệ tri thức",
  "Thị giác máy tính và điều khiển học thông minh",
];

const TRAINING_AREAS = [
  {
    title: "Công nghệ Tri thức",
    paragraphs: [
      "Cung cấp cho sinh viên những tri thức cao cấp nhất cùng các kỹ năng cần thiết để xây dựng các ứng dụng tích hợp với khả năng xử lý thông minh, ứng dụng trong giáo dục, đào tạo, kinh tế xã hội, khoa học và công nghệ, quản lý tài nguyên thiên nhiên và môi trường, bảo mật...",
      "Các kiến thức cung cấp bao gồm nền tảng về các hệ cơ sở tri thức, hệ tương tác người-máy, xử lý ngôn ngữ tự nhiên, nhận dạng mẫu, xử lý ảnh...",
    ],
  },
  {
    title: "Khoa học Máy tính",
    paragraphs: [
      "Cung cấp cho sinh viên những tri thức cao cấp nhất cùng các kỹ năng cần thiết để xây dựng các ứng dụng tích hợp với khả năng xử lý thông minh, ứng dụng trong giáo dục, đào tạo, kinh tế xã hội, khoa học và công nghệ, quản lý tài nguyên thiên nhiên và môi trường ...",
      "Các kiến thức cung cấp bao gồm nền tảng về các hệ cơ sở tri thức, hệ tương tác người-máy, nhận dạng mẫu, xử lý ảnh...",
    ],
  },
  {
    title: "Công nghệ Phần mềm",
    paragraphs: [
      "Cung cấp những kiến thức tổng quan trong cài đặt, quản lý và bảo trì các dự án, từ đó giúp cho sinh viên có thể thiết kế và cài đặt các sản phẩm phần mềm chất lượng cao.",
      "Sinh viên tốt nghiệp chuyên ngành này sẽ có khả năng phân tích, thiết kế, và quản trị các dự án phần mềm ở mức trung đến cao cấp.",
    ],
  },
  {
    title: "Hệ thống thông tin",
    paragraphs: [
      "Cung cấp cho sinh viên những tri thức cần thiết để có thể cài đặt và phát triển các dự án hệ thống thông tin trong quản lý kinh tế, quản lý văn phòng, quản lý dữ liệu.",
      "Tập trung vào các công nghệ ứng dụng trong lĩnh vực hệ thống thông tin như: mô hình hóa dữ liệu, các tiếp cận trong thiết kế cơ sở dữ liệu, các phương pháp phân tích và thiết kế hệ thống thông tin, các hệ thống thông tin phân tán…",
    ],
  },
  {
    title: "Mạng máy tính & Viễn thông",
    paragraphs: [
      "Cung cấp kiến thức trong lĩnh vực truyền thông giữa các mạng diện rộng, mạng máy tính cục bộ và giữa các hệ thống thông tin phân tán.",
      "Lĩnh vực nghiên cứu: An ninh máy tính và phát triển phần mềm an toàn; Devops; Phát triển phần mềm trên hệ thống phân tán; Triển khai & quản trị hệ thống cloud",
    ],
  },
  {
    title: "Thị giác máy tính & Điều khiển học thông minh",
    paragraphs: [
      "Nhằm mục đích đào tạo các cử nhân, kỹ sư chuyên về lĩnh vực xử lý ảnh số, video số và thiết kế phần mềm điều khiển Rô-bốt.",
      "Các hướng nghiên cứu: Truy vấn ảnh, video dựa vào nội dung; Sinh tin học; Nhận dạng ký tự trong ảnh, video; Nhận dạng hành động người; Mô phỏng mặt người và cảm xúc; Thị giác Rô-bốt; Tự động hóa thiết kế trong lĩnh vực kiến trúc, xây dựng.",
    ],
  },
];

const FacultyCNTTPage = () => {
  return (
    <Page
      title="Khoa Công nghệ Thông tin"
      meta={
        <meta
          name="description"
          content="Khoa Công nghệ Thông tin - Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
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
            width: "100%",
            maxHeight: { xs: 280, md: 360 },
            overflow: "hidden",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Box
            component="img"
            src={BANNER_IMG}
            alt="Khoa Công nghệ Thông tin"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>

        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            color: BANNER_BLUE,
            fontWeight: 700,
            textAlign: "center",
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            textTransform: "uppercase",
            mb: 4,
          }}
        >
          KHOA CÔNG NGHỆ THÔNG TIN
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}>
          Giới thiệu
        </Typography>
        <Typography variant="body1" sx={{ mb: 1.5, textAlign: "justify", lineHeight: 1.8 }}>
          Khoa Công nghệ Thông tin, Trường Đại học Khoa học Tự nhiên (thuộc Đại học Quốc gia TPHCM) là một trong những khoa hàng đầu đào tạo về lĩnh vực Máy tính và Công nghệ thông tin tại Việt Nam. Được thành lập vào năm 1995, Khoa không chỉ là một trong những cơ sở đào tạo trình độ đại học đầu tiên tại Việt Nam trong lĩnh vực Máy tính và Công nghệ thông tin mà còn là một trong những đơn vị lớn nhất cả về số lượng người học lẫn đội ngũ cán bộ giảng dạy. Đồng thời, Khoa còn là một trong những nơi có sự cạnh tranh tuyển sinh đầu vào cao nhất cả nước, chỉ tuyển sinh các thí sinh đạt điểm cao trong các kỳ thi trung học phổ thông quốc gia, đánh giá năng lực ĐHQG-HCM hàng năm và cũng là nơi thu hút các tài năng giành huy chương, giải thưởng trong các cuộc thi lập trình hoặc toán học cấp quốc gia hoặc quốc tế. Khoa có hơn 100 cán bộ giảng viên cơ hữu và nhiều giáo sư, giảng viên thỉnh giảng đến từ các trường đại học nổi tiếng trong và ngoài nước.
        </Typography>
        <Typography variant="body1" sx={{ mb: 1.5, textAlign: "justify", lineHeight: 1.8 }}>
          Hiện nay, Khoa đang đào tạo hơn 5.000 sinh viên ở các bậc học của trình độ đại học bao gồm bậc Đại học, Thạc sĩ và Tiến sĩ, bao phủ các ngành học trong lĩnh vực này bao gồm: Khoa học máy tính, Kỹ thuật phần mềm, Hệ thống thông tin, Công nghệ thông tin và Trí tuệ nhân tạo. Khoa có nhiều chương trình đào tạo bậc Đại học đa dạng bao gồm chương trình chính quy đào tạo bằng tiếng Việt, bằng tiếng Anh, bằng tiếng Pháp, chương trình tài năng, chương trình chất lượng cao và chương trình từ xa qua mạng.
        </Typography>
        <Typography variant="body1" sx={{ mb: 0.5, textAlign: "justify", lineHeight: 1.8 }}>
          Khoa gồm sáu bộ môn:
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
          {INTRO_BULLETS.map((item) => (
            <Typography key={item} component="li" sx={{ mb: 0.5, lineHeight: 1.7 }}>
              {item}
            </Typography>
          ))}
        </Box>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "justify", lineHeight: 1.8 }}>
          Khoa có các chương trình hợp tác và trao đổi sinh viên với các cơ sở giáo dục đại học nổi tiếng như Viện Tin học Quốc gia Nhật Bản (NII, Nhật Bản), Viện Khoa học và Công nghệ tiên tiến Nhật Bản (JAIST, Nhật Bản), Đại học Quốc gia Singapore (NUS), Portland State University (PSU, USA), University of Memphis (UM, USA), and University Claude Bernard Lyon 1 (UCBL1, France),...
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}>
          Sứ mạng
        </Typography>
        <Typography variant="body1" sx={{ mb: 1.5, textAlign: "justify", lineHeight: 1.8 }}>
          Cung cấp các trải nghiệm giảng dạy và học tập đẳng cấp cho các chương trình đào tạo bậc đại học và sau đại học trong lĩnh vực máy tính và công nghệ thông tin.
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "justify", lineHeight: 1.8 }}>
          Đào tạo sinh viên, học viên trở thành những nhà phát triển giải pháp công nghệ thông tin hoặc trở thành lãnh đạo chuyên nghiệp, thành công, tự quyết, có đạo đức, và đủ năng lực áp dụng kiến thức và kỹ năng để làm cho xã hội ngày càng tốt đẹp hơn.
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}>
          Tầm nhìn
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, textAlign: "justify", lineHeight: 1.8 }}>
          Trở thành một cơ sở đào tạo đẳng cấp thế giới trong lĩnh vực máy tính và công nghệ thông tin, cung cấp các chương trình đào tạo cùng các trải nghiệm dạy và học tuyệt vời tập trung vào việc sáng tạo và phát triển các giải pháp có chất lượng cao trên nền tảng sử dụng máy tính và công nghệ thông tin để đóng góp cho sự phát triển của xã hội.
        </Typography>

        <Typography
          variant="h2"
          component="h2"
          sx={{
            color: BANNER_BLUE,
            fontWeight: 700,
            textAlign: "center",
            fontSize: { xs: "1.25rem", md: "1.5rem" },
            textTransform: "uppercase",
            mb: 3,
          }}
        >
          Các lĩnh vực đào tạo
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {TRAINING_AREAS.map((area) => (
            <Box key={area.title}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                {area.title}
              </Typography>
              {area.paragraphs.map((para, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{ textAlign: "justify", lineHeight: 1.7, color: "text.secondary", mb: i < area.paragraphs.length - 1 ? 1 : 0 }}
                >
                  {para}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default FacultyCNTTPage;
