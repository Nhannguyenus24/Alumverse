package com.service.backend.article.controller;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.RequestParam;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NewsControllerValidationTest {

    @Test
    void publishedListDefaultsToPageZeroAndLimitFifteen() throws Exception {
        Method method = publishedMethod();

        assertThat(method.getParameters()[0].getAnnotation(RequestParam.class).defaultValue())
                .isEqualTo("0");
        assertThat(method.getParameters()[1].getAnnotation(RequestParam.class).defaultValue())
                .isEqualTo("15");
    }

    @Test
    void publishedListRejectsLimitAboveFifteen() throws Exception {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        Method method = publishedMethod();

        Set<ConstraintViolation<NewsController>> violations = validator.forExecutables()
                .validateParameters(new NewsController(null), method, new Object[]{
                        0, 16, 1, "", "", null, null, "newest"
                });

        assertThat(violations)
                .extracting(violation -> violation.getPropertyPath().toString())
                .anyMatch(path -> path.endsWith(".limit"));
    }

    @Test
    void publishedListAcceptsMaximumLimit() throws Exception {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        Method method = publishedMethod();

        Set<ConstraintViolation<NewsController>> violations = validator.forExecutables()
                .validateParameters(new NewsController(null), method, new Object[]{
                        0, 15, 1, "", "", null, null, "newest"
                });

        assertThat(violations).isEmpty();
    }

    private Method publishedMethod() throws NoSuchMethodException {
        return NewsController.class.getMethod(
                "getPublished",
                int.class, int.class, Integer.class, String.class, String.class,
                LocalDate.class, LocalDate.class, String.class);
    }
}
