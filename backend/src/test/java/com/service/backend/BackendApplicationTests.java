package com.service.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import com.service.backend.integration.BaseIntegrationTest;

@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests extends BaseIntegrationTest {

	@Test
	void contextLoads() {
		// Đảm bảo rằng webTestClient được inject thành công từ lớp Base
		org.junit.jupiter.api.Assertions.assertNotNull(webTestClient);
	}

}
