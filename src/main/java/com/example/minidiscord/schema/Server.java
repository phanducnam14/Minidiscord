package com.example.minidiscord.schema;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "servers")
public class Server {
    @Id
    private String id;

    private String name;
    private String iconUrl;

    @Indexed
    private String ownerId;

    // Danh sách thành viên với role
    private List<ServerMember> members = new ArrayList<>();

    private LocalDateTime createdAt;

    public Server(String name, String iconUrl, String ownerId) {
        this.name = name;
        this.iconUrl = iconUrl;
        this.ownerId = ownerId;
        this.createdAt = LocalDateTime.now();
        // Người tạo server tự động là OWNER
        ServerMember ownerMember = new ServerMember(
            ownerId,
            ServerMember.Role.OWNER,
            LocalDateTime.now()
        );
        this.members.add(ownerMember);
    }
}
