package com.ptit.iot.controller;

import com.ptit.iot.dto.LoginRequest;
import com.ptit.iot.dto.LoginResponse;
import com.ptit.iot.entity.User;
import com.ptit.iot.security.AuthTokenService;
import com.ptit.iot.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthTokenService authTokenService;

    public AuthController(UserService userService, AuthTokenService authTokenService) {
        this.userService = userService;
        this.authTokenService = authTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(new LoginResponse(false, "Vui lòng nhập tên đăng nhập và mật khẩu!", null));
        }

        Optional<User> user = userService.authenticate(request.getUsername(), request.getPassword());
        if (user.isPresent()) {
            User safeUser = user.get();
            safeUser.setPassword("******"); // Do not expose password
            String token = authTokenService.issue(safeUser.getUsername());
            return ResponseEntity.ok(new LoginResponse(true, "Đăng nhập thành công!", safeUser, token));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(false, "Sai tên đăng nhập hoặc mật khẩu!", null));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            authTokenService.revoke(authorization.substring(7).trim());
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đăng xuất thành công!"
        ));
    }
}

