package com.service.backend.auth.presentation.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(
            regexp="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
            message="Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    private String password;

//    @NotBlank(message = "fullName is required")
//    private String fullName;

//     @NotBlank(message = "reCAPTCHA token is required")
//     private String recaptchaToken;

//     @Pattern(
//             regexp="^(MALE|FEMALE|OTHER)$",
//             message="Gender must be one of MALE, FEMALE, OTHER"
//     )
//     private String gender;

//     @Pattern(
//             regexp="^(\\+84|0)[0-9]{9,10}$",
//             message="Phone number is not valid"
//     )
//     private String phone;

//     @NotNull(message = "Date of birth is required")
//     @Past(message = "Date of birth must be in the past")
//     private LocalDate dob;


//     private String bio;
}
