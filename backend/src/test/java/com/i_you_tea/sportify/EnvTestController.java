package com.i_you_tea.sportify;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EnvTestController {

    // Will inject DB_USERNAME from environment or return NOT_FOUND if missing
    @Value("${DB_USERNAME:NOT_FOUND}")
    private String dbUsername;

    @GetMapping("/test-env")
    public String getEnv() {
        return "DB_USERNAME=" + dbUsername;
    }
}