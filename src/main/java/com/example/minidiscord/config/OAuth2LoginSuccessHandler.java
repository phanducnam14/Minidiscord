package com.example.minidiscord.config;

import com.example.minidiscord.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.Locale;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    private static final String LOCALHOST = "localhost";
    private static final String LOOPBACK_V4 = "127.0.0.1";
    private static final String LOOPBACK_V6 = "::1";

    private final UserService userService;

    public OAuth2LoginSuccessHandler(UserService userService) {
        this.userService = userService;
    }

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                       Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        // Lưu hoặc cập nhật user trong database
        userService.findOrCreateUser(oauth2User);

        // Redirect về frontend, ưu tiên config; nếu config vẫn là localhost mặc định
        // thì dùng host thật của request để hỗ trợ truy cập từ máy khác.
        response.sendRedirect(resolveFrontendBaseUrl(request) + "/home");
    }

    String resolveFrontendBaseUrl(HttpServletRequest request) {
        URI configuredUri = URI.create(frontendUrl);
        if (!isLocalHost(configuredUri.getHost())) {
            return trimTrailingSlash(frontendUrl);
        }

        String requestHost = firstHeaderValue(request.getHeader("X-Forwarded-Host"));
        if (requestHost == null || requestHost.isBlank()) {
            requestHost = request.getServerName();
        }

        String normalizedRequestHost = stripPort(requestHost);
        if (isLocalHost(normalizedRequestHost)) {
            return trimTrailingSlash(frontendUrl);
        }

        String scheme = firstHeaderValue(request.getHeader("X-Forwarded-Proto"));
        if (scheme == null || scheme.isBlank()) {
            scheme = request.getScheme();
        }

        StringBuilder redirectUrl = new StringBuilder();
        redirectUrl.append(scheme).append("://").append(normalizedRequestHost);

        return redirectUrl.toString();
    }

    private String firstHeaderValue(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }

        return headerValue.split(",")[0].trim();
    }

    private String stripPort(String host) {
        if (host == null) {
            return null;
        }

        String normalized = host.trim();
        if (normalized.startsWith("[")) {
            int closingBracketIndex = normalized.indexOf(']');
            return closingBracketIndex > 0 ? normalized.substring(1, closingBracketIndex) : normalized;
        }

        int portSeparatorIndex = normalized.indexOf(':');
        return portSeparatorIndex >= 0 ? normalized.substring(0, portSeparatorIndex) : normalized;
    }

    private boolean isLocalHost(String host) {
        if (host == null || host.isBlank()) {
            return true;
        }

        String normalized = host.trim().toLowerCase(Locale.ROOT);
        return LOCALHOST.equals(normalized)
            || LOOPBACK_V4.equals(normalized)
            || LOOPBACK_V6.equals(normalized);
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
