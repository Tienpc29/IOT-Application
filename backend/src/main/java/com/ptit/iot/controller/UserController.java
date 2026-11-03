package com.ptit.iot.controller;

import com.ptit.iot.dto.ProfileDTO;
import com.ptit.iot.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileDTO> getProfile(
            @RequestParam(defaultValue = "admin") String username,
            Authentication authentication) {
        return userService.getProfile(authentication.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileDTO> updateProfile(
            @RequestParam(defaultValue = "admin") String username,
            @RequestBody ProfileDTO dto,
            Authentication authentication) {
        ProfileDTO updated = userService.updateProfile(authentication.getName(), dto);
        return ResponseEntity.ok(updated);
    }
}

