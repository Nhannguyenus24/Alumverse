package com.service.backend.presentation.controller;

import com.service.backend.presentation.dto.ApiResponse;
import com.service.backend.presentation.dto.ExampleDto.GreetingDto;
import com.service.backend.usecase.ExampleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/example")
@RequiredArgsConstructor
public class ExampleController {

    private final ExampleService exampleService;

    @PostMapping("/greet")
    public ResponseEntity<?> greet(@Valid @RequestBody GreetingDto greetingDto) {
        String greeting = exampleService.sayHello(greetingDto.getName());
        return ResponseEntity
                .status(200)
                .body(new ApiResponse<>("Call say hello successfully", greeting));
    }
}
