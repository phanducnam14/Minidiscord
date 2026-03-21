package com.example.minidiscord.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Cấu hình static resource handler để serve file upload từ thư mục local
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /uploads/** → thư mục local uploads
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations(absolutePath);
    }
}
