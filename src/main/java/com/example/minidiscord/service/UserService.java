package com.example.minidiscord.service;

import com.example.minidiscord.dto.UserDTO;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    /**
     * Tìm hoặc tạo user sau khi OAuth2 login thành công
     */
    public User findOrCreateUser(OAuth2User oauth2User) {
        String googleId = oauth2User.getName();
        String email = oauth2User.getAttribute("email");
        String displayName = oauth2User.getAttribute("name");
        String avatarUrl = oauth2User.getAttribute("picture");

        Optional<User> existing = userRepository.findByGoogleId(googleId);
        if (existing.isPresent()) {
            // Cập nhật thông tin mới nhất từ Google (chỉ cập nhật nếu chưa có thông tin tùy chỉnh hoặc muốn sync)
            User user = existing.get();
            // Nếu bạn muốn giữ thông tin cá nhân của Discord thì có thể bỏ qua bước sync này
            // user.setDisplayName(displayName);
            // user.setAvatarUrl(avatarUrl);
            return userRepository.save(user);
        }

        User newUser = new User(googleId, email, displayName, avatarUrl);
        return userRepository.save(newUser);
    }

    /**
     * Cập nhật thông tin người dùng
     */
    public User updateUser(String userId, String displayName, String avatarUrl) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        
        if (displayName != null && !displayName.trim().isEmpty()) {
            user.setDisplayName(displayName);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }
        
        return userRepository.save(user);
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public UserDTO toDTO(User user) {
        return new UserDTO(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getAvatarUrl(),
            user.getCreatedAt()
        );
    }
}
