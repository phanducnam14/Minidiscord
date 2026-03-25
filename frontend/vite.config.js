import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: ['.ngrok-free.dev'],
    proxy: {
      '/ws': { 
        target: 'http://localhost:8080', 
        ws: true,
        changeOrigin: true
      },
      '/api': { 
        target: 'http://localhost:8080', 
        changeOrigin: true,
        cookieDomainRewrite: "",
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-Forwarded-Port', '443');
          proxyReq.setHeader('X-Forwarded-Proto', 'https');
          proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
        }
      },
      '/uploads': { 
        target: 'http://localhost:8080', 
        changeOrigin: true,
        cookieDomainRewrite: "",
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-Forwarded-Port', '443');
          proxyReq.setHeader('X-Forwarded-Proto', 'https');
          proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
        }
      },
      '/oauth2': { 
        target: 'http://localhost:8080', 
        changeOrigin: false,
        cookieDomainRewrite: "",
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-Forwarded-Port', '443');
          proxyReq.setHeader('X-Forwarded-Proto', 'https');
          proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
        }
      },
      '/login/oauth2': { 
        target: 'http://localhost:8080', 
        changeOrigin: false,
        cookieDomainRewrite: "",
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-Forwarded-Port', '443');
          proxyReq.setHeader('X-Forwarded-Proto', 'https');
          proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
        }
      },
      '/logout': { 
        target: 'http://localhost:8080', 
        changeOrigin: true,
        cookieDomainRewrite: "",
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-Forwarded-Port', '443');
          proxyReq.setHeader('X-Forwarded-Proto', 'https');
          proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
        }
      },
    }
  }
})
