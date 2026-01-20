# Alumniverse Backend - Multi-Module Project

## 📋 Tổng quan

Đây là backend của hệ thống Alumniverse, được xây dựng theo kiến trúc **Maven Multi-Module** với Spring Boot WebFlux (Reactive).

## 🏗️ Cấu trúc Project

```
backend_new_structure/
├── pom.xml                 # Parent POM - quản lý dependencies chung
├── common/                 # Module chứa code dùng chung
│   ├── pom.xml
│   └── src/main/java/com/service/common/
│       ├── constants/      # Error codes, constants
│       ├── dto/            # Data Transfer Objects
│       ├── entity/         # Database entities
│       ├── enums/          # Enumerations
│       └── exception/      # Custom exceptions
│
├── auth/                   # Module xử lý authentication
│   ├── pom.xml
│   └── src/main/java/com/service/auth/
│       ├── dao/            # Data Access Objects (Repositories)
│       ├── domain/         # Repository interfaces
│       ├── presentation/   # Controllers, DTOs
│       └── usecase/        # Business logic (Services)
│
├── main/                   # Module chính - Entry point
│   ├── pom.xml
│   └── src/main/java/com/service/main/
│       ├── config/         # Spring configurations
│       ├── exception/      # Global exception handlers
│       └── MainApplication.java  # @SpringBootApplication
│
└── [future-module]/        # Các module khác trong tương lai
```

## 📦 Mô tả các Module

### 1. `common` - Shared Code Module

**Chức năng:** Chứa tất cả code dùng chung giữa các module

| Thư mục | Nội dung |
|---------|----------|
| `constants/` | Error codes, application constants |
| `dto/` | ApiResponse, shared DTOs |
| `entity/` | Tất cả database entities (User, Event, Job, etc.) |
| `enums/` | Enumerations (UserRole, AccountStatus, etc.) |
| `exception/` | ApplicationException và custom exceptions |

**Lưu ý:**
- ❌ KHÔNG có controllers, services
- ✅ Chỉ chứa POJOs và utilities

### 2. `auth` - Authentication Module

**Chức năng:** Xử lý tất cả logic liên quan đến authentication & authorization

| Thư mục | Nội dung |
|---------|----------|
| `dao/` | Repository implementations |
| `domain/` | Repository interfaces |
| `presentation/` | AuthController, request DTOs |
| `usecase/` | AuthService và implementations |


### 3. `main` - Application Entry Point

**Chức năng:** Module chính, nơi DUY NHẤT chạy application

| Thư mục | Nội dung |
|---------|----------|
| `config/` | R2dbcConfig, WebFluxConfig, SecurityConfig |
| `exception/` | GlobalExceptionHandler |
| `MainApplication.java` | Entry point với @SpringBootApplication |
| `resources/application.yml` | TẤT CẢ configurations |

**Quan trọng:**
- ✅ Chỉ module này có `@SpringBootApplication`
- ✅ Chỉ module này có `spring-boot-maven-plugin`
- ✅ Tất cả config (`application.yml`) đặt ở đây

---

## ➕ Hướng dẫn thêm Module mới

### Bước 1: Tạo thư mục module

```bash
mkdir -p new-module/src/main/java/com/service/newmodule
mkdir -p new-module/src/main/resources
mkdir -p new-module/src/test/java/com/service/newmodule
```

### Bước 2: Tạo `pom.xml` cho module

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" ...>
    <modelVersion>4.0.0</modelVersion>
    
    <!-- QUAN TRỌNG: Parent phải là backend -->
    <parent>
        <groupId>com.service</groupId>
        <artifactId>backend</artifactId>
        <version>0.0.1-SNAPSHOT</version>
    </parent>
    
    <artifactId>new-module</artifactId>
    <name>new-module</name>
    <description>Description of your module</description>

    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <!-- Depend on common để dùng entities, DTOs -->
        <dependency>
            <groupId>com.service</groupId>
            <artifactId>common</artifactId>
            <version>${project.version}</version>
        </dependency>
        
        <!-- Thêm dependencies riêng của module nếu cần -->
    </dependencies>
    
    <!-- KHÔNG CẦN spring-boot-maven-plugin (trừ khi là executable) -->
</project>
```

### Bước 3: Đăng ký module trong Parent POM

Thêm vào `backend_new_structure/pom.xml`:

```xml
<modules>
    <module>common</module>
    <module>auth</module>
    <module>new-module</module>  <!-- Thêm dòng này -->
    <module>main</module>
</modules>
```

### Bước 4: Thêm dependency vào `main` module

Trong `main/pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>com.service</groupId>
        <artifactId>new-module</artifactId>
        <version>${project.version}</version>
    </dependency>
</dependencies>
```

### Bước 5: Tạo cấu trúc code

```
new-module/src/main/java/com/service/newmodule/
├── dao/                    # Repository implementations
├── domain/                 # Repository interfaces  
├── presentation/
│   ├── controller/         # REST Controllers
│   └── dto/                # Request/Response DTOs
└── usecase/
    ├── NewModuleService.java      # Service interface
    └── impl/
        └── NewModuleServiceImpl.java  # Service implementation
```

### Bước 6: Build và verify

```bash
# Từ thư mục backend_new_structure
mvn clean install
```

---

## 🔧 Checklist khi thêm Module mới

- [ ] `pom.xml` có parent đúng (`com.service:backend`)
- [ ] Đã đăng ký trong parent POM (`<modules>`)
- [ ] Package declarations đúng (`com.service.newmodule.*`)
- [ ] Depend on `common` module
- [ ] `main` module depend on module mới
- [ ] **KHÔNG** có `spring-boot-maven-plugin`
- [ ] **KHÔNG** có `application.yml` riêng

---

## 🚀 Chạy Application

### Development

```bash
# Từ thư mục backend_new_structure
./run.sh

# Hoặc manual
mvn clean install
cd main
mvn spring-boot:run
```

### Production

```bash
mvn clean package -DskipTests
java -jar main/target/main-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

## 📚 Tài liệu liên quan

- [MULTI_MODULE_SETUP_GUIDE.md](./MULTI_MODULE_SETUP_GUIDE.md) - Hướng dẫn chi tiết setup multi-module project
- [CODING_GUIDELINE.md](../docs/CODING_GUIDELINE.md) - Quy chuẩn coding
- [COMMIT_RULES.md](../docs/COMMIT_RULES.md) - Quy tắc commit

---
