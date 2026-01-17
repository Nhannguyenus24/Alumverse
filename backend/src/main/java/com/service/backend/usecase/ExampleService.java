package com.service.backend.usecase;

import org.springframework.stereotype.Service;

@Service
public class ExampleService {

    public String sayHello(String name) {
        return "Hello, " + name;
    }
}
