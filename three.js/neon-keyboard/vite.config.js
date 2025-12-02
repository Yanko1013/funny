import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 优化构建输出
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境关闭sourcemap以减小体积
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动分包，将大依赖单独打包
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
        },
      },
    },
    // 增大chunk大小警告限制（Three.js项目通常较大）
    chunkSizeWarningLimit: 1000,
  },
  // 确保public目录下的资源正确复制
  publicDir: 'public',
})
