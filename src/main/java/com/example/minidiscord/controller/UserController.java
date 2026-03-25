package com.example.minidiscord.controller;

import com.example.minidiscord.dto.UploadResponse;
import com.example.minidiscord.dto.UserDTO;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.service.FileUploadService;
import com.example.minidiscord.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final FileUploadService fileUploadService;

    /**
     * Cập nhật thông tin profile (tên hiển thị)
     */
    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(
            @AuthenticationPrincipal OAuth2User oauth2User,
            @RequestBody Map<String, String> updates) {
        
        if (oauth2User == null) return ResponseEntity.status(401).build();
        
        User user = userService.findByGoogleId(oauth2User.getName())
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        
        String displayName = updates.get("displayName");
        User updated = userService.updateUser(user.getId(), displayName, null);
        
        return ResponseEntity.ok(userService.toDTO(updated));
    }

    /**
     * Upload và cập nhật ảnh đại diện
     */
    @PostMapping("/profile/avatar")
    public ResponseEntity<UserDTO> updateAvatar(
            @AuthenticationPrincipal OAuth2User oauth2User,
            @RequestParam("file") MultipartFile file) {
        
        if (oauth2User == null) return ResponseEntity.status(401).build();
        
        try {
            User user = userService.findByGoogleId(oauth2User.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
            
            // Dùng "profiles" làm folder chung cho ảnh đại diện
            UploadResponse uploadResponse = fileUploadService.uploadFile(file, "profiles");
            
            User updated = userService.updateUser(user.getId(), null, uploadResponse.getFileUrl());
            
            return ResponseEntity.ok(userService.toDTO(updated));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
