package com.example.minidiscord.service;

import com.example.minidiscord.dto.UploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {
    // Các loại file được phép upload
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final Set<String> ALLOWED_FILE_TYPES = Set.of(
        "application/pdf",
        "application/zip",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    /**
     * Validate và lưu file upload, trả về UploadResponse
     */
    public UploadResponse uploadFile(MultipartFile file, String channelId) throws IOException {
        // Kiểm tra file có rỗng không
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File không được rỗng");
        }

        // Kiểm tra kích thước
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File quá lớn (tối đa 10MB)");
        }

        String contentType = file.getContentType();
        boolean isImage = ALLOWED_IMAGE_TYPES.contains(contentType);
        boolean isFile = ALLOWED_FILE_TYPES.contains(contentType);

        if (!isImage && !isFile) {
            throw new IllegalArgumentException("Loại file không được hỗ trợ: " + contentType);
        }

        // Tạo thư mục theo channelId
        Path channelDir = Paths.get(uploadDir, channelId);
        Files.createDirectories(channelDir);

        // Tạo tên file duy nhất
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String savedFilename = UUID.randomUUID() + extension;

        // Lưu file
        Path targetPath = channelDir.resolve(savedFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Tạo URL truy cập
        String fileUrl = "/uploads/" + channelId + "/" + savedFilename;
        String fileType = isImage ? "IMAGE" : "FILE";

        return new UploadResponse(fileUrl, originalFilename, fileType);
    }
}
