package com.example.minidiscord.config;

import com.example.minidiscord.repository.UserRepository;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OAuth2LoginSuccessHandlerTest {

    @Test
    void usesExplicitConfiguredFrontendUrlWhenNonLocal() throws Exception {
        OAuth2LoginSuccessHandler handler = createHandler("https://chat.example.com");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("192.168.1.50");
        request.setServerPort(8080);
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(request, response, authentication());

        assertEquals("https://chat.example.com/home", response.getRedirectedUrl());
    }

    @Test
    void keepsLocalhostRedirectForLocalDevelopment() throws Exception {
        OAuth2LoginSuccessHandler handler = createHandler("http://localhost:3000");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(8080);
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(request, response, authentication());

        assertEquals("http://localhost:3000/home", response.getRedirectedUrl());
    }

    @Test
    void usesRemoteRequestHostWhenConfiguredUrlIsLocalhostFallback() throws Exception {
        OAuth2LoginSuccessHandler handler = createHandler("http://localhost:3000");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("192.168.1.10");
        request.setServerPort(8080);
        request.addHeader("X-Forwarded-Proto", "https");
        request.addHeader("X-Forwarded-Host", "chat.example.com");
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(request, response, authentication());

        assertEquals("https://chat.example.com/home", response.getRedirectedUrl());
    }

    private OAuth2LoginSuccessHandler createHandler(String frontendUrl) {
        OAuth2LoginSuccessHandler handler = new OAuth2LoginSuccessHandler(createUserService());
        ReflectionTestUtils.setField(handler, "frontendUrl", frontendUrl);
        return handler;
    }

    private UserService createUserService() {
        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
            UserRepository.class.getClassLoader(),
            new Class[]{UserRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "findByGoogleId", "findByEmail", "findById" -> Optional.empty();
                case "save" -> args[0];
                case "saveAll" -> args[0];
                case "findAll" -> List.of();
                case "count" -> 0L;
                case "existsById" -> false;
                case "deleteById", "delete", "deleteAllById", "deleteAll", "deleteAllInBatch", "deleteAllByIdInBatch", "deleteAllInBatchIterable", "deleteInBatch", "flush" -> null;
                case "insert" -> args[0];
                case "toString" -> "UserRepositoryProxy";
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                default -> throw new UnsupportedOperationException("Unexpected method: " + method.getName());
            }
        );

        return new UserService(userRepository);
    }

    private TestingAuthenticationToken authentication() {
        OAuth2User oauth2User = new DefaultOAuth2User(
            List.of(),
            Map.of(
                "sub", "google-123",
                "email", "user@example.com",
                "name", "Test User",
                "picture", "https://example.com/avatar.png"
            ),
            "sub"
        );

        return new TestingAuthenticationToken(oauth2User, null);
    }
}
