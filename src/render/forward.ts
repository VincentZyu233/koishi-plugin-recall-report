import { Bot, h } from 'koishi'
import { StoredMessage } from '../types'

/**
 * 合并转发交付模式渲染器
 * OneBot: 生成带有 forward 属性的消息树节点
 * 其它平台: 降级生成带发送者昵称前缀的引用消息
 */
export function renderForward(
  bot: Bot,
  storedMsg: StoredMessage,
  rawElements: h[]
): h | h[] {
  const isOneBot = bot.platform === 'onebot'

  if (isOneBot) {
    return h('message', { forward: true }, [
      h('message', { userId: storedMsg.userId, nickname: storedMsg.username }, rawElements)
    ])
  }

  return [
    h.text(`📝 [${storedMsg.username}] 原撤回内容：\n`),
    ...rawElements,
  ]
}
