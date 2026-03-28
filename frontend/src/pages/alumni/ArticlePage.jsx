import { Link } from "react-router";
import { Box, Container, Typography, Button } from "@mui/material";
import Page from "../../components/Page";
import Breadcrumb from "../../components/Breadcrumb";

const BANNER_IMG = "https://kenh14cdn.com/203336854389633024/2022/6/4/photo-4-16543508788131048796642.png";
const ARTICLE_IMG = "https://vcdn1-vnexpress.vnecdn.net/2025/07/28/ai-1753664373-1753664398-5310-1753664411.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=L9Jh3NGehMlCpb4bdZ8xzA";

const ARTICLE_POST = {
  title: "Lê Yên Thanh",
  author: "Nguyễn Văn A",
  date: "12/12/2026",
  paragraphs: [
    "Từng có cơ hội làm việc cho Google nhưng Lê Yên Thanh từ chối để ở lại Việt Nam đầu quân cho một số startup, sau đó khởi nghiệp với BusMap. CEO sinh năm 1994 là một trong 6 đại diện của Việt Nam vừa được vinh danh trong Forbes 30 under 30 châu Á năm 2022.",
    "Sở hữu bảng thành tích “khủng”, được truyền thông ưu ái gọi là “chàng trai vàng tin học” của Việt Nam nhưng Lê Yên Thanh thú nhận “vì tham gia quá nhiều cuộc thi nên tôi cũng không nhớ chính xác mình đã đạt tất cả bao nhiêu giải thưởng”.",
    "Bắt đầu làm quen và yêu thích tin học từ những năm cấp 2, chàng trai quê An Giang này từng đoạt giải nhất kỳ thi học sinh giỏi tin học quốc gia và được tuyển thẳng vào đại học. Năm 2015, anh giành giải nhì cuộc thi Nhân tài Đất Việt. Cùng năm đó, Lê Yên Thanh được vinh danh là Gương mặt trẻ tiêu biểu của Việt Nam khi mới 21 tuổi.",
    "Với vai trò là nhà sáng lập và CEO Phenikaa Mass – công ty cung cấp các giải pháp công nghệ giao thông, Lê Yên Thanh vừa lọt Top 30 under 30 châu Á của tạp chí Forbes. Startup của Thanh trước đây mang tên BusMap nhưng đã đổi thành Phenikaa Mass sau khi nhận đầu tư 1,5 triệu USD từ Phenikaa, tập đoàn do doanh nhân Hồ Xuân Năng sáng lập.",
    
  ],
};

const ArticlePage = () => {
  return (
    <Page
      title="Lê Yên Thanh"
      meta={
        <meta
          name="description"
          content="Bài viết về Lê Yên Thanh - CEO Phenikaa Mass, Forbes 30 under 30 Asia"
        />
      }
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ display: "flex", flexDirection: "column" }}
      >
        {/* Hero + absolute content frame wrapper */}
        <Box
          sx={{
            position: "relative",
            height: { xs: "70vh", sm: "75vh", md: "85vh" },
            minHeight: { xs: 360, md: 480 },
          }}
        >
          {/* Hero banner */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${BANNER_IMG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* Main content frame */}
          <Box
            sx={{
              position: "absolute",
              top: { xs: "50%", sm: "52%", md: "55%" },
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 1200,
                backgroundColor: "#fff",
                borderRadius: 2,
                boxShadow:
                  "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                overflow: "hidden",
                py: { xs: 5, md: 6 },
                px: { xs: 4, md: 6 },
              }}
            >
              {/* Breadcrumb */}
              <Breadcrumb
                items={[
                  { label: "VINH DANH", path: "/honors" },
                  { label: ARTICLE_POST.title },
                ]}
                fontSize="0.8rem"
              />

              {/* Title */}
              <Typography
                variant="h1"
                component="h1"
                fontWeight={700}
                color="primary.main"
                textAlign="center"
                sx={{
                  mb: 1,
                  fontSize: { xs: "1.8rem", md: "2.1rem" },
                }}
              >
                {ARTICLE_POST.title}
              </Typography>

              {/* Author + Date */}
              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  mb: 4,
                }}
              >
                {ARTICLE_POST.author} • {ARTICLE_POST.date}
              </Typography>

              {/* Article Image */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 4,
                }}
              >
                <Box
                  component="img"
                  src={ARTICLE_IMG}
                  alt={ARTICLE_POST.title}
                  sx={{
                    width: { xs: "100%", md: "60%" },
                    borderRadius: 2,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                />
              </Box>

              {/* Article Paragraphs */}
              {ARTICLE_POST.paragraphs.map((para, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    lineHeight: 1.8,
                    mb: 2,
                    textAlign: "justify",
                    color: "text.primary",
                  }}
                >
                  {para}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Placeholder space */}
        <Box sx={{ minHeight: { xs: 1200, md: 800 } }} />
      </Container>
    </Page>
  );
};

export default ArticlePage;