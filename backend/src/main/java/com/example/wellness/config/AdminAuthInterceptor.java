package com.example.wellness.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String method = request.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        String path = (contextPath != null && !contextPath.isEmpty()) ? uri.substring(contextPath.length()) : uri;

        // 1. Allow Login endpoint
        if ("/api/admin/login".equals(path)) {
            return true;
        }

        HttpSession session = request.getSession(false);
        String adminUsername = session != null ? (String) session.getAttribute("adminUsername") : null;
        String providerLicenseId = session != null ? (String) session.getAttribute("providerLicenseId") : null;

        // 2. Dual-role check for PUT /api/wellness-hubs/{id}
        if ("PUT".equalsIgnoreCase(method) && path.matches("^/api/wellness-hubs/[^/]+$")) {
            String targetId = path.substring("/api/wellness-hubs/".length());
            if (adminUsername != null) {
                return true;
            }
            if (providerLicenseId != null) {
                if (providerLicenseId.equals(targetId)) {
                    return true;
                }
                sendForbidden(response);
                return false;
            }
            sendUnauthorized(response);
            return false;
        }

        // 3. Admin-only endpoints
        if (isAdminOnlyEndpoint(method, path)) {
            if (adminUsername != null) {
                return true;
            }
            sendUnauthorized(response);
            return false;
        }

        return true;
    }

    private boolean isAdminOnlyEndpoint(String method, String path) {
        // /api/admin/** (all admin endpoints require login except /api/admin/login)
        if (path.startsWith("/api/admin/")) {
            return !"/api/admin/login".equals(path);
        }

        // /api/account-requests: GET /api/account-requests, GET
        // /api/account-requests/{id}, PUT /approve, PUT /reject, POST /{id}/notify
        // (Public: /api/account-requests/track and POST /api/account-requests)
        if (path.startsWith("/api/account-requests")) {
            if ("GET".equalsIgnoreCase(method)) {
                return !"/api/account-requests/track".equals(path);
            }
            if ("PUT".equalsIgnoreCase(method)) {
                return true;
            }
            if ("DELETE".equalsIgnoreCase(method)) {
                return true;
            }
            if ("POST".equalsIgnoreCase(method)) {
                return path.endsWith("/notify") || path.contains("/notify");
            }
            return false;
        }

        // /api/main-routes:
        // Admin-only: GET /api/main-routes (root list), POST, PUT, DELETE, POST
        // /upload-image
        // Public: GET /api/main-routes/{id}, GET /api/main-routes/user/**
        if ("/api/main-routes".equals(path) && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.startsWith("/api/main-routes")) {
            if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)
                    || "DELETE".equalsIgnoreCase(method)) {
                return true;
            }
            return false;
        }

        // /api/articles: POST, PUT, DELETE
        // (Public: GET /api/articles, GET /api/articles/{id})
        if (path.startsWith("/api/articles")) {
            if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)
                    || "DELETE".equalsIgnoreCase(method)) {
                return true;
            }
            return false;
        }

        // /api/wellness-hubs: GET /next-license-id, POST /api/wellness-hubs, POST
        // /api/wellness-hubs/search, DELETE /api/wellness-hubs/{id}
        if (path.startsWith("/api/wellness-hubs")) {
            if ("/api/wellness-hubs/next-license-id".equals(path)) {
                return true;
            }
            if ("POST".equalsIgnoreCase(method)
                    && ("/api/wellness-hubs".equals(path) || "/api/wellness-hubs/search".equals(path))) {
                return true;
            }
            if ("DELETE".equalsIgnoreCase(method)) {
                return true;
            }
            return false;
        }

        return false;
    }

    private void sendUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"กรุณาเข้าสู่ระบบ\"}");
    }

    private void sendForbidden(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"ท่านไม่มีสิทธิ์จัดการข้อมูลสถานประกอบการนี้\"}");
    }
}