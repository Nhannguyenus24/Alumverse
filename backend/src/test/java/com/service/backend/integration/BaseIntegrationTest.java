package com.service.backend.integration;

import com.service.backend.shared.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Autowired
    protected WebTestClient webTestClient;

    // Chặn gửi email thật ra ngoài
    @MockBean
    protected EmailService emailService;

    // Singleton container across all integration tests
    public static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("postgres")
            .withUsername("postgres")
            .withPassword("postgres")
            // Nạp thẳng bản export dữ liệu Production vào DB Test lúc khởi động
            .withCopyFileToContainer(
                    MountableFile.forHostPath(Paths.get("../docs/postgres.sql").toAbsolutePath()),
                    "/docker-entrypoint-initdb.d/init.sql"
            );

    static {
        postgreSQLContainer.start();
        try (Connection connection = DriverManager.getConnection(
                postgreSQLContainer.getJdbcUrl(),
                postgreSQLContainer.getUsername(),
                postgreSQLContainer.getPassword());
             java.sql.Statement statement = connection.createStatement()) {
            // The historical dump predates the chat unread-counter migration.
            statement.execute("ALTER TABLE chat_group_members ADD COLUMN IF NOT EXISTS last_read_at timestamp without time zone");
            statement.execute("UPDATE chat_group_members SET last_read_at = CURRENT_TIMESTAMP WHERE last_read_at IS NULL");
        } catch (SQLException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        String r2dbcUrl = String.format("r2dbc:postgresql://%s:%d/%s",
                postgreSQLContainer.getHost(),
                postgreSQLContainer.getFirstMappedPort(),
                postgreSQLContainer.getDatabaseName());

        // Ép Spring Boot R2DBC kết nối vào container Test thay vì DB thật
        registry.add("spring.r2dbc.url", () -> r2dbcUrl);
        registry.add("spring.r2dbc.username", postgreSQLContainer::getUsername);
        registry.add("spring.r2dbc.password", postgreSQLContainer::getPassword);

        // Tắt Flyway vì file postgres.sql đã tạo sẵn schema và data rồi
        registry.add("spring.flyway.enabled", () -> "false");
    }
}
