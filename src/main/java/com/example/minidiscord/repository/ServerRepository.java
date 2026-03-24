package com.example.minidiscord.repository;

import com.example.minidiscord.schema.Server;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServerRepository extends MongoRepository<Server, String> {
    // Tìm servers mà user là member (query vào subdocument)
    @Query("{ 'members.userId': ?0 }")
    List<Server> findByMemberUserId(String userId);

    List<Server> findByOwnerId(String ownerId);
}
