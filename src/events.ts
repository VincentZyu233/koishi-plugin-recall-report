import { Context, Logger } from 'koishi'
import { Config, StoredMessage } from './types'
import { Utils } from './utils'
import { MessageStorage } from './storage'
import { RecallRenderer } from './renderer'

const logger = new Logger('recall-report:events')

/** 注册 Satori 通用事件监听器 */
export function registerEvents(
  ctx: Context,
  config: Config,
  utils: Utils,
  storage: MessageStorage,
  renderer: RecallRenderer
) {
  // ==================== 1. 监听消息并存入缓存 ====================
  ctx.on('message', async (session) => {
    // Satori 通用公域判定：非私聊、存在 guildId 或 subtype 为 group
    const isGuildMsg = !session.isDirect || Boolean(session.guildId) || session.subtype === 'group'
    if (!isGuildMsg) return

    // 检查是否命中该群配置
    const groupConfig = utils.matchGroupConfig(session.platform, session.channelId)
    if (!groupConfig) return

    // 存储标准消息数据
    const stored: StoredMessage = {
      platform: session.platform,
      channelId: session.channelId,
      guildId: session.guildId,
      messageId: session.messageId,
      userId: session.userId,
      username: session.author?.name || session.username || session.userId,
      avatar: utils.resolveUserAvatar(session),
      content: session.content,
      elements: session.elements,
      timestamp: session.timestamp,
    }

    storage.saveMessage(stored)
  })

  // ==================== 2. 监听 Satori 标准撤回事件 ====================
  ctx.on('message-deleted', async (session) => {
    logger.debug(`[message-deleted] 收到撤回事件: platform=${session.platform}, channelId=${session.channelId}, messageId=${session.messageId}`)

    // 通用公域判定：解耦 subtype === 'group' 硬编码
    const isGuildRecall = !session.isDirect || Boolean(session.guildId) || session.subtype === 'group'
    if (!isGuildRecall) return

    // 检查是否命中群组配置
    const groupConfig = utils.matchGroupConfig(session.platform, session.channelId)
    if (!groupConfig) {
      logger.debug(`[${session.platform}] 群/频道 ${session.channelId} 未启用撤回监听`)
      return
    }

    // 查找被撤回的消息实体
    const storedMsg = storage.getMessage(session.platform, session.channelId, session.messageId)
    if (!storedMsg) {
      logger.debug(`[${session.platform}] 未找到被撤回的消息缓存: ${session.messageId}`)
      return
    }

    // 调用渲染引擎分发
    await renderer.dispatchRecallReport(session, storedMsg, groupConfig)

    // 清理已处理的单条消息缓存
    storage.deleteMessage(session.platform, session.channelId, session.messageId)
  })

  logger.info('已成功注册 Satori 全平台消息与撤回监听器')
}
