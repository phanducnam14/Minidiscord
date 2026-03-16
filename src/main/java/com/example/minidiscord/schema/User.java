package com.example.minidiscord.schema;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    
    private String googleId;
    private String email;
    private String name;
    private String profilePicture;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public User(String googleId, String email, String name, String profilePicture) {
        this.googleId = googleId;
        this.email = email;
        this.name = name;
        this.profilePicture = profilePicture;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
