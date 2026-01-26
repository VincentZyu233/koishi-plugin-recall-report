import { Context, h, Logger } from 'koishi'
import {} from 'koishi-plugin-adapter-onebot'
import { Config, StoredMessage } from './types'
import { Utils } from './utils'
import { MessageStorage } from './storage'

const logger = new Logger('onebot-recall-report:events')

/** 注册事件监听器 */
export function registerEvents(
  ctx: Context,
  config: Config,
  utils: Utils,
  storage: MessageStorage
) {
  // ==================== 监听消息并保存 ====================
  ctx.on('message', async (session) => {
    // 只处理群消息
    if (!session.guildId) return

    // 检查是否需要监听此群
    const groupConfig = utils.getGroupConfig(session.channelId)
    if (!groupConfig) return

    // 存储消息
    const stored: StoredMessage = {
      messageId: session.messageId,
      channelId: session.channelId,
      userId: session.userId,
      username: session.username || session.userId,
      content: session.content,
      elements: session.elements,
      timestamp: session.timestamp,
    }

    storage.saveMessage(stored)
  })

  // ==================== 监听撤回事件 ====================
  ctx.on('message-deleted', async (session) => {
    logger.info(`[message-deleted] 收到撤回事件`)
    logger.info(`[message-deleted] messageId: ${session.messageId}`)
    logger.info(`[message-deleted] channelId: ${session.channelId}`)
    logger.info(`[message-deleted] userId: ${session.userId}`)
    logger.info(`[message-deleted] subtype: ${session.subtype}`)

    // 只处理群消息撤回
    if (session.subtype !== 'group') return

    // 检查是否需要监听此群
    const groupConfig = utils.getGroupConfig(session.channelId)
    if (!groupConfig) {
      logger.debug(`群 ${session.channelId} 未启用撤回监听`)
      return
    }

    // 查找被撤回的消息
    const storedMsg = storage.getMessage(session.messageId)
    if (!storedMsg) {
      logger.warn(`未找到被撤回的消息: ${session.messageId}`)
      return
    }

    logger.info(`找到被撤回的消息，开始构建通知...`)

    // 构建第一条普通消息：基本信息 + 头像
    const headerLines = [
      `📢 【群消息撤回】`,
      `━━━━━━━━━━━━━━━━`,
      `群号: ${session.channelId}`,
      `撤回者: ${storedMsg.username}(${storedMsg.userId})`,
      `撤回时间: ${utils.formatTime(session.timestamp)}`,
      `原消息时间: ${utils.formatTime(storedMsg.timestamp)}`,
      ``,
      `消息内容见合并转发 ↓`,
    ]

    const headerMessage = [
      h.image(utils.getGroupAvatarUrl(session.channelId)),
      h.text('\n'),
      h.image(utils.getQQAvatarUrl(storedMsg.userId)),
      h.text('\n\n' + headerLines.join('\n')),
    ]

    // 构建合并转发消息：包含原始消息内容和作者信息
    const forwardMessages: h[] = []
    
    // 使用原始消息元素，并指定原始发送者的信息
    const messageAttrs = {
      userId: storedMsg.userId,
      nickname: storedMsg.username,
    }
    
    if (storedMsg.elements && storedMsg.elements.length > 0) {
      forwardMessages.push(h('message', messageAttrs, storedMsg.elements))
    } else {
      // 如果没有元素，使用文本内容
      forwardMessages.push(h('message', messageAttrs, [h.text(storedMsg.content)]))
    }

    const forwardMessage = h('message', { forward: true }, forwardMessages)

    // 发送到主人
    if (groupConfig.sendToMaster) {
      const masters = utils.getEnabledMasters()
      for (const master of masters) {
        try {
          const bot = ctx.bots.find(b => b.platform === master.platform)
          if (!bot) {
            logger.warn(`未找到平台 ${master.platform} 的 bot`)
            continue
          }

          // 先发普通消息
          await bot.sendPrivateMessage(master.userId, headerMessage)
          // 延迟一下再发合并转发
          await new Promise(resolve => setTimeout(resolve, 100))
          await bot.sendPrivateMessage(master.userId, forwardMessage)
          logger.info(`已发送撤回通知到主人 ${master.platform}:${master.userId}`)
        } catch (error) {
          logger.error(`发送到主人失败:`, error)
        }
      }
    }

    // 发送到群里
    if (groupConfig.sendToGroup) {
      try {
        // 先发普通消息
        await session.bot.sendMessage(session.channelId, headerMessage)
        // 延迟一下再发合并转发
        await new Promise(resolve => setTimeout(resolve, 100))
        await session.bot.sendMessage(session.channelId, forwardMessage)
        logger.info(`已发送撤回通知到群 ${session.channelId}`)
      } catch (error) {
        logger.error(`发送到群失败:`, error)
      }
    }

    // 清理已处理的消息
    storage.deleteMessage(session.messageId)
  })

  logger.info('已注册事件监听器')
}
