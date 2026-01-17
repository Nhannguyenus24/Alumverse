package com.service.backend.othermodule.presentation.controller;

import com.service.backend.othermodule.usecase.ExampleService;
import com.service.backend.othermodule.presentation.dto.ExampleDto.GreetingDto;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
