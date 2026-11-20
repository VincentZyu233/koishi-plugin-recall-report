import { Bot, Context, h, Logger, Session } from 'koishi'
import { Config, GroupConfig, StoredMessage } from './types'
import { Utils } from './utils'

const logger = new Logger('recall-report:renderer')

/** 跨平台自适应渲染与分发引擎 */
export class RecallRenderer {
  constructor(
    private ctx: Context,
    private config: Config,
    private utils: Utils
  ) {}

  /**
   * 调度并分发撤回报告
   */
  async dispatchRecallReport(session: Session, storedMsg: StoredMessage, groupConfig: GroupConfig): Promise<void> {
    logger.info(`[${storedMsg.platform}] 收到 ${storedMsg.username}(${storedMsg.userId}) 消息撤回，正在分发展示...`)

    // 1. 构建头部信息文本
    const headerLines = [
      `📢 【消息撤回通知】`,
      `━━━━━━━━━━━━━━━━`,
      `🌐 平台: ${storedMsg.platform}`,
      `💬 频道/群号: ${storedMsg.channelId}`,
      `👤 发送者: ${storedMsg.username} (${storedMsg.userId})`,
      `⏱️ 撤回时间: ${this.utils.formatTime(session.timestamp)}`,
      `🕒 原消息时间: ${this.utils.formatTime(storedMsg.timestamp)}`,
    ]

    // 2. 解析头像
    const groupAvatar = this.utils.resolveGroupAvatar(session, storedMsg)
    const userAvatar = this.utils.resolveUserAvatar(session, storedMsg)

    const headerElements: h[] = []
    if (groupAvatar) headerElements.push(h.image(groupAvatar))
    if (userAvatar) headerElements.push(h.image(userAvatar))
    headerElements.push(h.text('\n' + headerLines.join('\n')))

    // 3. 构建消息体元素
    const rawElements = (storedMsg.elements && storedMsg.elements.length > 0)
      ? storedMsg.elements
      : [h.text(storedMsg.content || '')]

    // 4. 发送到主人账号 (私聊推送)
    if (groupConfig.sendToMaster) {
      const masters = this.utils.getEnabledMasters()
      for (const master of masters) {
        try {
          const targetBot = this.ctx.bots.find(b => b.platform === master.platform)
          if (!targetBot) {
            logger.warn(`未找到接收平台 [${master.platform}] 的可用 Bot 实例，跳过向主人上报`)
            continue
          }

          await this.sendToUser(targetBot, master.userId, headerElements, rawElements, storedMsg)
          logger.info(`已成功向主人 [${master.platform}:${master.userId}] 投递撤回报告`)
        } catch (err) {
          logger.error(`向主人 [${master.platform}:${master.userId}] 发送撤回报告失败:`, err)
        }
      }
    }

    // 5. 发送到群里 (群内公开提示)
    if (groupConfig.sendToGroup) {
      try {
        await this.sendToChannel(session.bot, session.channelId, headerElements, rawElements, storedMsg)
        logger.info(`已成功向原群/频道 [${session.platform}:${session.channelId}] 发送撤回提醒`)
      } catch (err) {
        logger.error(`向群组 [${session.platform}:${session.channelId}] 发送撤回提醒失败:`, err)
      }
    }
  }

  /**
   * 自适应向用户私聊发送
   */
  private async sendToUser(bot: Bot, userId: string, headerElements: h[], rawElements: h[], storedMsg: StoredMessage): Promise<void> {
    const isOneBot = bot.platform === 'onebot'

    if (isOneBot && this.config.preferForward) {
      // OneBot 平台：发送头部卡片，再发送合并转发卡片
      await bot.sendPrivateMessage(userId, headerElements)
      await new Promise(r => setTimeout(r, 120))
      const forwardMsg = h('message', { forward: true }, [
        h('message', { userId: storedMsg.userId, nickname: storedMsg.username }, rawElements)
      ])
      await bot.sendPrivateMessage(userId, forwardMsg)
    } else {
      // 非 OneBot / 现代公域平台 (Discord, KOOK, Matrix, 飞书等)：组装为图文与引用块
      const combined: h[] = [
        ...headerElements,
        h.text('\n━━━━━━━━━━━━━━━━\n📝 原消息内容：\n'),
        ...rawElements,
      ]

      if (typeof bot.createDirectChannel === 'function') {
        const channel = await bot.createDirectChannel(userId)
        await bot.sendMessage(channel.id, combined)
      } else if (typeof bot.sendPrivateMessage === 'function') {
        await bot.sendPrivateMessage(userId, combined)
      } else {
        await bot.sendMessage(userId, combined)
      }
    }
  }

  /**
   * 自适应向频道/群组发送
   */
  private async sendToChannel(bot: Bot, channelId: string, headerElements: h[], rawElements: h[], storedMsg: StoredMessage): Promise<void> {
    const isOneBot = bot.platform === 'onebot'

    if (isOneBot && this.config.preferForward) {
      await bot.sendMessage(channelId, headerElements)
      await new Promise(r => setTimeout(r, 120))
      const forwardMsg = h('message', { forward: true }, [
        h('message', { userId: storedMsg.userId, nickname: storedMsg.username }, rawElements)
      ])
      await bot.sendMessage(channelId, forwardMsg)
    } else {
      const combined: h[] = [
        ...headerElements,
        h.text('\n━━━━━━━━━━━━━━━━\n📝 原消息内容：\n'),
        ...rawElements,
      ]
      await bot.sendMessage(channelId, combined)
    }
  }
}
