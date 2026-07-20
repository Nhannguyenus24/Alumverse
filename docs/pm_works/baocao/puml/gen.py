# -*- coding: utf-8 -*-
import io, os, subprocess
from PIL import Image
C = io.open('common.txt', encoding='utf-8').read()

def diag(name, actor, parent, boundary, group, ucs, rels=()):
    L=["@startuml", C, "left to right direction"]
    if parent:
        L += ['actor "%s" as PA' % parent, 'actor "%s" as AC' % actor, "PA <|-- AC"]
    else:
        L += ['actor "%s" as AC' % actor]
    L += ['rectangle "%s" {' % boundary, '  package "%s" {' % group]
    for i,(t,kind) in enumerate(ucs):
        L.append('    usecase "%s" as U%d' % (t,i))
    L += ["  }", "}"]
    for i,(t,kind) in enumerate(ucs):
        if kind=='a': L.append("AC --> U%d" % i)
    for a,b,st in rels:
        L.append("U%d ..> U%d : <<%s>>" % (a,b,st))
    L.append("@enduml")
    io.open(name+'.puml','w',encoding='utf-8').write("\n".join(L))
    return name

A=lambda t:(t,'a'); I=lambda t:(t,'i')
SYS="Hệ thống AlumVerse 2026"
ONE="Hệ thống AlumVerse 2026 - phạm vi một đơn vị"
ALL="Hệ thống AlumVerse 2026 - phạm vi toàn hệ thống"

specs=[
 ("uc1-guest","Khách vãng lai",None,SYS,"Nội dung công khai và tài khoản",
  [A("Xem tin tức của đơn vị"),A("Xem bài viết cựu sinh viên tiêu biểu"),
   A("Xem vinh danh thành tích"),A("Xem danh sách sự kiện sắp diễn ra"),
   A("Xem giới thiệu chương trình và ngành đào tạo"),A("Chọn đơn vị để truy cập"),
   A("Đăng ký tài khoản"),I("Kích hoạt tài khoản bằng mã OTP"),
   A("Đăng nhập và duy trì phiên"),I("Xác minh chống bot"),
   A("Khôi phục mật khẩu qua email")],
  [(6,7,"include"),(8,9,"include")]),

 ("uc2a-student","Sinh viên","Khách vãng lai",SYS,"Hồ sơ, xác minh và thiết lập cá nhân",
  [A("Quản lý hồ sơ cá nhân và nghề nghiệp"),A("Xem hồ sơ công khai của thành viên khác"),
   A("Thiết lập cá nhân và tùy chọn thông báo"),A("Đổi email có xác thực hai đầu"),
   A("Nộp minh chứng xác minh tài khoản"),A("Gửi yêu cầu cập nhật thông tin học vấn"),
   A("Xem nhật ký đăng nhập"),A("Xem trung tâm thông báo và nhận thông báo đẩy")],[]),

 ("uc2b-student","Sinh viên",None,SYS,"Kết nối, nhắn tin, diễn đàn và nội dung",
  [A("Tìm kiếm thành viên trong mạng lưới"),A("Gửi và phản hồi yêu cầu kết nối"),
   A("Nhắn tin cá nhân"),A("Nhắn tin nhóm"),I("Đính kèm ảnh và video"),
   A("Chặn và bỏ chặn người dùng"),A("Tham gia chủ đề diễn đàn nghề nghiệp"),
   A("Tìm kiếm và theo dõi chủ đề"),A("Tìm việc làm"),A("Truy cập kho học liệu"),
   A("Lưu nội dung để xem sau"),A("Xem chuyên trang phát triển sự nghiệp")],
  [(2,1,"include"),(4,2,"extend")]),

 ("uc2c-student","Sinh viên",None,SYS,"Sự kiện, cố vấn, quỹ và trợ lý ảo",
  [A("Quan tâm và đăng ký tham dự sự kiện"),I("Nhận vé điện tử"),A("Xem vé của tôi"),
   A("Đăng ký làm người được cố vấn"),A("Tìm kiếm và ghép cặp người cố vấn"),
   A("Đặt lịch buổi cố vấn"),I("Kiểm tra khung giờ còn trống"),
   A("Tham gia buổi cố vấn qua phòng họp trực tuyến"),A("Đánh giá và phản hồi sau buổi"),
   A("Báo cáo sự cố buổi cố vấn"),A("Đóng góp cho quỹ của đơn vị"),
   A("Trả lời khảo sát"),A("Hỏi đáp với trợ lý ảo")],
  [(0,1,"include"),(5,6,"include")]),

 ("uc3-alumni","Cựu sinh viên","Sinh viên",SYS,"Use case bổ sung của Cựu sinh viên",
  [A("Đăng ký và khai báo hồ sơ người cố vấn"),I("Nhận gợi ý thẻ kỹ năng bằng AI"),
   I("Tự động điền hồ sơ từ tệp CV"),A("Khai báo và quản lý khung giờ rảnh"),
   A("Duyệt, dời lịch hoặc hủy buổi cố vấn"),A("Gắn liên kết phòng họp trực tuyến"),
   A("Đăng tin tuyển dụng"),A("Chia sẻ học liệu cho cộng đồng"),
   A("Gửi bài viết cựu sinh viên tiêu biểu"),A("Gửi thành tích để vinh danh"),
   I("Gửi bài chờ kiểm duyệt"),A("Xác minh chéo cho cựu sinh viên khác")],
  [(0,1,"extend"),(0,2,"extend"),(6,10,"include"),(7,10,"include"),(8,10,"include"),(9,10,"include")]),

 ("uc4a-facultyadmin","Quản trị viên cấp khoa",None,ONE,"Kiểm duyệt nội dung và quản lý sự kiện",
  [A("Duyệt bài viết, tin tức và thành tích"),A("Quản lý chuyên mục diễn đàn"),
   A("Kiểm duyệt và điều hành chủ đề"),I("Kiểm duyệt tự động bằng AI"),
   A("Tạo và quản lý vòng đời sự kiện"),A("Điểm danh người tham dự bằng mã QR"),
   A("Gửi thư mời tham dự"),A("Thống kê và xuất báo cáo tham dự"),
   A("Xem bảng điều khiển thống kê của đơn vị")],
  [(0,3,"extend"),(2,3,"extend")]),

 ("uc4b-facultyadmin","Quản trị viên cấp khoa",None,ONE,"Người dùng, cố vấn, quỹ và khảo sát",
  [A("Duyệt hồ sơ người cố vấn"),A("Theo dõi và xử lý báo cáo buổi cố vấn"),
   A("Xác minh danh tính người dùng"),A("Duyệt yêu cầu cập nhật học vấn"),
   A("Quản lý tài khoản người dùng trong đơn vị"),
   A("Tạo và vận hành chiến dịch gây quỹ"),A("Đối soát giao dịch đóng góp"),
   A("Xem bảng điều khiển quỹ"),A("Tạo và phát khảo sát"),
   A("Thu thập và tổng hợp kết quả khảo sát")],
  [(6,7,"include")]),

 ("uc5a-schooladmin","Quản trị viên cấp trường","Quản trị viên cấp khoa",ALL,"Vòng đời và cấu hình đơn vị",
  [A("Khởi tạo trang khoa"),A("Duyệt yêu cầu đăng ký tổ chức mới"),
   A("Cấu hình đường dẫn và phát hành đơn vị"),A("Khai báo chương trình và ngành đào tạo"),
   A("Tùy biến thương hiệu và giao diện đơn vị"),A("Bật tắt từng nhóm tính năng theo đơn vị"),
   A("Cấu hình quyền riêng tư của đơn vị"),A("Cấp và thu hồi tài khoản quản trị đơn vị")],[]),

 ("uc5b-schooladmin","Quản trị viên cấp trường",None,ALL,"Hạ tầng dùng chung toàn hệ thống",
  [A("Quản lý mẫu thư điện tử"),A("Quản lý kho tri thức của trợ lý ảo"),
   A("Quản lý nhà cung cấp mô hình ngôn ngữ"),A("Giám sát vận hành toàn hệ thống"),
   A("Tra cứu nhật ký kiểm toán")],[]),
]
names=[diag(*sp) for sp in specs]
subprocess.run(["java","-DPLANTUML_LIMIT_SIZE=16384","-Dfile.encoding=UTF-8","-jar",
  "../node_modules/node-plantuml/vendor/plantuml.jar","-charset","UTF-8","-tpng"]+[n+".puml" for n in names],
  check=False)
for n in ["uc0-actors"]+names:
    w,h=Image.open(n+".png").size
    wcm,hcm=w/150*2.54,h/150*2.54
    sc=min(15.5/wcm,19.35/hcm)
    print("%-24s %5dx%-5d -> %.1fcm  font %.1fpt" % (n,w,h,wcm*sc,15*sc))
