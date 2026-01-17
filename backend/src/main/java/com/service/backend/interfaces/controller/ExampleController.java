package com.service.backend.interfaces.controller;

import com.service.backend.application.ExampleService;
import com.service.backend.interfaces.dto.ExampleDto.GreetingDto;
import com.service.backend.interfaces.dto.ApiResponse;
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
