import { h, Session } from 'koishi'
import { StoredMessage } from '../types'
import { Utils } from '../utils'

export interface TextAndImageRenderOptions {
  recallTimeStr: string
  originalTimeStr: string
}

/**
 * 图文交付模式渲染器
 * 结构：群/频道头像（若有） + 用户头像（若有） + 结构化多行撤回审计文本
 */
export function renderTextAndImage(
  session: Session,
  storedMsg: StoredMessage,
  utils: Utils,
  options: TextAndImageRenderOptions
): h[] {
  const headerLines = [
    `📢 【消息撤回通知】`,
    `━━━━━━━━━━━━━━━━`,
    `🌐 平台: ${storedMsg.platform}`,
    `💬 频道/群号: ${storedMsg.channelId}`,
    `👤 发送者: ${storedMsg.username} (${storedMsg.userId})`,
    `⏱️ 撤回时间: ${options.recallTimeStr}`,
    `🕒 原消息时间: ${options.originalTimeStr}`,
  ]

  const groupAvatar = utils.resolveGroupAvatar(session, storedMsg)
  const userAvatar = utils.resolveUserAvatar(session, storedMsg)

  const elements: h[] = []
  if (groupAvatar) elements.push(h.image(groupAvatar))
  if (userAvatar) elements.push(h.image(userAvatar))
  elements.push(h.text('\n' + headerLines.join('\n')))

  return elements
}
