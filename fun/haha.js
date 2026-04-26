const bcrypt = require('bcrypt');

async function handlePassword() {
    const plainPassword = "Student@2024"; // Chuỗi bạn muốn băm
    const saltRounds = 12; // Độ phức tạp (khuyên dùng từ 10-12)

    try {
        // --- BƯỚC 1: TẠO HASH ---
        // Hàm này tự động tạo Salt và băm chuỗi cho bạn
        const hash = await bcrypt.hash(plainPassword, saltRounds);
        
        console.log("1. Chuỗi gốc:", plainPassword);
        console.log("2. Kết quả Hash để lưu vào DB:", hash);
        console.log("-----------------------------------------");

        // --- BƯỚC 2: KIỂM TRA (VERIFY) ---
        // Khi người dùng đăng nhập, bạn so sánh chuỗi họ nhập với hash từ DB
        const isMatch = await bcrypt.compare(plainPassword, hash);
        
        if (isMatch) {
            console.log("=> Kết quả: Khớp! Cho phép đăng nhập.");
        } else {
            console.log("=> Kết quả: Không khớp!");
        }

    } catch (err) {
        console.error("Lỗi khi xử lý:", err);
    }
}

handlePassword();