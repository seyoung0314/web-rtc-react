import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,  // 포트 설정
    proxy: {
      '/janus': {
        target: 'https://janus.jsflux.co.kr',  // 프록시할 서버 URL
        changeOrigin: true,  // 요청의 origin 헤더를 target 서버로 변경
        secure: false,  // https를 사용하므로 false로 설정
        rewrite: (path) => path.replace(/^\/janus/, '/janus'),  // 경로 변환
      },
    },
    allowedHosts: ['js1.jsflux.co.kr', 'localhost', '127.0.0.1'],  // 허용된 호스트 목록에 추가
  },
});
