package com.example.minidiscord.repository;

import com.example.minidiscord.schema.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByEmail(String email);
}
