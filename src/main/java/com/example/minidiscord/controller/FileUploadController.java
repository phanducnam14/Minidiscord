package com.example.minidiscord.controller;

import com.example.minidiscord.dto.UploadResponse;
import com.example.minidiscord.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FileUploadController {
    private final FileUploadService fileUploadService;

    /**
     * Upload file: ảnh hoặc tài liệu, tối đa 10MB
     * Request param: file (MultipartFile), channelId (String)
     */
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("channelId") String channelId) {
        try {
            UploadResponse response = fileUploadService.uploadFile(file, channelId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
