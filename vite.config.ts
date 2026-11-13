import path from 'path'
import { defineConfig } from '@lark-apaas/coding-preset-vite-react'

/**
 * 品牌兜底插件。
 *
 * 平台发布时会把 HTML 里的 appName / appDescription 等占位符注入成应用真实名称；
 * 如果脱离平台自行构建，这些占位符不会被替换，页面标题就会显示成占位符本身。
 * 这里在 HTML 处理完成后补上品牌信息。
 *
 * 注意：不要动 basename / environment / appAvatar 这几个占位符，
 * 它们和运行路径、环境、鉴权相关，必须留给运行时注入。
 */
function qingshijiBranding() {
  return {
    name: 'qingshiji-branding',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      return html
        .replace(/\{\{appName\}\}/g, '轻食计')
        .replace(/\{\{appDescription\}\}/g, 'AI 健康饮食助手')
        .replace(/<title>轻食计<\/title>/g, '<title>轻食计 · AI 健康饮食助手</title>')
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  plugins: [qingshijiBranding()],
})
