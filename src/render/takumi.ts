import { Renderer } from '@takumi-rs/wasm/node'
import { container, text } from '@takumi-rs/helpers'
import { Context, Logger } from 'koishi'
import { StoredMessage } from '../types'
import { resolveRenderFontBuffer } from '../font'

const logger = new Logger('recall-report:takumi')

export interface TakumiRenderOptions {
  width?: number
  darkMode?: boolean
  fontPath?: string
  recallTime: string
  originalTime: string
}

let rendererInstance: Renderer | null = null
let loadedFontSignature: string | null = null

/**
 * 获取或创建 Takumi 渲染器实例并确保注册中文字体
 * 注意：@takumi-rs/wasm 2.x 不通过构造函数传递 fonts，必须调用 registerFont 进行字体注册！
 */
async function getTakumiRenderer(ctx: Context, customFontPath?: string): Promise<Renderer> {
  const fontData = await resolveRenderFontBuffer(ctx, customFontPath)
  const signature = `${customFontPath || 'lxgw-managed'}-${fontData.length}`

  if (!rendererInstance || loadedFontSignature !== signature) {
    logger.info(`[Takumi] 正在初始化 Takumi WASM 渲染器并注册中文字体 (${fontData.length} bytes)...`)
    const renderer = new Renderer()
    try {
      const registered = await renderer.registerFont(fontData)
      logger.info(`[Takumi] 中文字体成功注册！已加载字系:`, registered.map(f => f.name).join(', '))
    } catch (err) {
      logger.error('[Takumi] 注册中文字体失败:', err)
      throw err
    }
    rendererInstance = renderer
    loadedFontSignature = signature
  }

  return rendererInstance
}

/**
 * 使用 Takumi WASM 渲染精美的高清撤回审计报告卡片大图
 */
export async function renderTakumiCard(
  ctx: Context,
  storedMsg: StoredMessage,
  options: TakumiRenderOptions
): Promise<Buffer> {
  const width = options.width || 640
  const isDark = Boolean(options.darkMode)

  const theme = isDark ? {
    bg: '#18181c',
    cardBg: '#23232a',
    border: '#353542',
    accent: '#7aa2f7',
    tagBg: 'rgba(122, 162, 247, 0.18)',
    textPrimary: '#f0f0f8',
    textSecondary: '#a0a0b2',
    contentBg: '#131316',
    contentBorder: '#2b2b36',
    footerText: '#6c6c80',
  } : {
    bg: '#f4f5f8',
    cardBg: '#ffffff',
    border: '#e4e7ed',
    accent: '#3b82f6',
    tagBg: 'rgba(59, 130, 246, 0.12)',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    contentBg: '#f9fafb',
    contentBorder: '#e5e7eb',
    footerText: '#9ca3af',
  }

  // 提取纯文本内容与元素概要
  let rawContent = storedMsg.content || ''
  if (!rawContent && storedMsg.elements && storedMsg.elements.length > 0) {
    rawContent = storedMsg.elements.map(e => {
      if (e.type === 'text') return e.attrs.content || ''
      if (e.type === 'image' || e.type === 'img') return '[图片]'
      if (e.type === 'audio') return '[语音]'
      if (e.type === 'video') return '[视频]'
      if (e.type === 'face') return `[表情: ${e.attrs.id || ''}]`
      return `[${e.type}]`
    }).join('')
  }
  if (!rawContent.trim()) {
    rawContent = '（无文字内容，可能包含富媒体或外部卡片）'
  }

  // 避免内容过长撑破卡片
  if (rawContent.length > 450) {
    rawContent = rawContent.slice(0, 450) + '... (内容过长已截断)'
  }

  const rootNode = container({
    style: {
      width,
      backgroundColor: theme.bg,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    children: [
      // 卡片主体
      container({
        style: {
          backgroundColor: theme.cardBg,
          borderRadius: 14,
          border: `1.5px solid ${theme.border}`,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        },
        children: [
          // 顶部栏: 标题与平台频道徽章
          container({
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: `1px solid ${theme.border}`,
            },
            children: [
              container({
                style: {
                  display: 'flex',
                  alignItems: 'center',
                },
                children: [
                  text('消息撤回审计报告', {
                    fontSize: 18,
                    fontWeight: 700,
                    color: theme.textPrimary,
                  }),
                ]
              }),
              container({
                style: {
                  backgroundColor: theme.tagBg,
                  borderRadius: 6,
                  padding: '4px 10px',
                },
                children: [
                  text(`${storedMsg.platform.toUpperCase()} · ${storedMsg.channelId}`, {
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.accent,
                  }),
                ]
              })
            ]
          }),

          // 发信人与时间戳
          container({
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            },
            children: [
              container({
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                },
                children: [
                  text('发送者：', { fontSize: 13, color: theme.textSecondary, fontWeight: 600 }),
                  text(`${storedMsg.username}`, { fontSize: 14, color: theme.textPrimary, fontWeight: 700 }),
                  text(`(${storedMsg.userId})`, { fontSize: 12, color: theme.textSecondary }),
                ]
              }),
              container({
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                },
                children: [
                  text('撤回时间：', { fontSize: 13, color: theme.textSecondary }),
                  text(`${options.recallTime}`, { fontSize: 13, color: theme.textPrimary }),
                ]
              }),
              container({
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                },
                children: [
                  text('原发送时间：', { fontSize: 13, color: theme.textSecondary }),
                  text(`${options.originalTime}`, { fontSize: 13, color: theme.textPrimary }),
                ]
              }),
            ]
          }),

          // 原消息内容高亮卡片
          container({
            style: {
              backgroundColor: theme.contentBg,
              borderRadius: 10,
              border: `1px solid ${theme.contentBorder}`,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            },
            children: [
              text('原消息内容：', {
                fontSize: 12,
                fontWeight: 600,
                color: theme.accent,
              }),
              text(rawContent, {
                fontSize: 15,
                lineHeight: 1.55,
                color: theme.textPrimary,
              }),
            ]
          }),
        ]
      }),

      // 底部水印声明
      container({
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        },
        children: [
          text('Takumi WASM 极速渲染 · recall-report v0.3.0', {
            fontSize: 11,
            color: theme.footerText,
          }),
        ]
      })
    ]
  })

  const renderer = await getTakumiRenderer(ctx, options.fontPath)
  const rendered = await renderer.render(rootNode, { width, format: 'png' })
  return Buffer.from(rendered)
}
