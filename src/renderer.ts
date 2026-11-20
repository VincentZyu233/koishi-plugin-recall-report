import { Bot, Context, h, Logger, Session } from 'koishi'
import { Config, GroupConfig, StoredMessage } from './types'
import { Utils } from './utils'
import { renderRecallCard } from './takumi/card'

const logger = new Logger('recall-report:renderer')

/** 跨平台多交付形式自适应渲染与分发引擎 */
export class RecallRenderer {
  constructor(
    private ctx: Context,
    private config: Config,
    private utils: Utils
  ) {}

  /**
   * 调度并分发撤回报告（多选模式：勾选几个就发送几条独立消息）
   */
  async dispatchRecallReport(session: Session, storedMsg: StoredMessage, groupConfig: GroupConfig): Promise<void> {
    const modes = Array.isArray(this.config.reportModes) && this.config.reportModes.length > 0
      ? this.config.reportModes
      : ['text-and-image', 'forward']

    logger.info(`[${storedMsg.platform}] 收到 ${storedMsg.username}(${storedMsg.userId}) 消息撤回，准备执行交付模式: ${modes.join(', ')}`)

    const recallTimeStr = this.utils.formatTime(session.timestamp)
    const originalTimeStr = this.utils.formatTime(storedMsg.timestamp)

    // 1. 构建图文消息 (若勾选 text-and-image)
    let textAvatarMessage: h[] | null = null
    if (modes.includes('text-and-image')) {
      const headerLines = [
        `📢 【消息撤回通知】`,
        `━━━━━━━━━━━━━━━━`,
        `🌐 平台: ${storedMsg.platform}`,
        `💬 频道/群号: ${storedMsg.channelId}`,
        `👤 发送者: ${storedMsg.username} (${storedMsg.userId})`,
        `⏱️ 撤回时间: ${recallTimeStr}`,
        `🕒 原消息时间: ${originalTimeStr}`,
      ]

      const groupAvatar = this.utils.resolveGroupAvatar(session, storedMsg)
      const userAvatar = this.utils.resolveUserAvatar(session, storedMsg)

      textAvatarMessage = []
      if (groupAvatar) textAvatarMessage.push(h.image(groupAvatar))
      if (userAvatar) textAvatarMessage.push(h.image(userAvatar))
      textAvatarMessage.push(h.text('\n' + headerLines.join('\n')))
    }

    // 2. 预生成 Takumi 卡片大图 (若勾选 takumi)
    let takumiMessage: h[] | null = null
    if (modes.includes('takumi')) {
      try {
        const pngBuffer = await renderRecallCard(storedMsg, {
          width: this.config.takumiWidth,
          darkMode: this.config.takumiDarkMode,
          fontPath: this.config.takumiFontPath,
          recallTime: recallTimeStr,
          originalTime: originalTimeStr,
        })
        takumiMessage = [h.image(pngBuffer, 'image/png')]
        logger.debug(`Takumi WASM 卡片图渲染成功 (${pngBuffer.length} bytes)`)
      } catch (err) {
        logger.error('Takumi 卡片渲染失败，回退跳过出图:', err)
      }
    }

    // 3. 构建合并转发卡片 / 引用元素
    const rawElements = (storedMsg.elements && storedMsg.elements.length > 0)
      ? storedMsg.elements
      : [h.text(storedMsg.content || '')]

    // 4. 执行发送到主人账号 (私聊推送)
    if (groupConfig.sendToMaster) {
      const masters = this.utils.getEnabledMasters()
      for (const master of masters) {
        try {
          const targetBot = this.ctx.bots.find(b => b.platform === master.platform)
          if (!targetBot) {
            logger.warn(`未找到接收平台 [${master.platform}] 的可用 Bot 实例，跳过向主人上报`)
            continue
          }

          await this.sendDeliveries(targetBot, master.userId, true, {
            modes,
            textAvatarMessage,
            takumiMessage,
            rawElements,
            storedMsg,
          })
          logger.info(`已成功向主人 [${master.platform}:${master.userId}] 投递撤回报告 (共 ${modes.length} 条消息)`)
        } catch (err) {
          logger.error(`向主人 [${master.platform}:${master.userId}] 发送撤回报告失败:`, err)
        }
      }
    }

    // 5. 执行发送到群里 (群内公开提示，仅在 sendToGroup 为 true 时执行)
    if (groupConfig.sendToGroup) {
      try {
        await this.sendDeliveries(session.bot, session.channelId, false, {
          modes,
          textAvatarMessage,
          takumiMessage,
          rawElements,
          storedMsg,
        })
        logger.info(`已成功向原群/频道 [${session.platform}:${session.channelId}] 发送撤回提醒`)
      } catch (err) {
        logger.error(`向群组 [${session.platform}:${session.channelId}] 发送撤回提醒失败:`, err)
      }
    }
  }

  /**
   * 按勾选的模式逐条发送消息实体（选几种发几条，最多 3 条）
   */
  private async sendDeliveries(
    bot: Bot,
    targetId: string,
    isDirect: boolean,
    payload: {
      modes: string[]
      textAvatarMessage: h[] | null
      takumiMessage: h[] | null
      rawElements: h[]
      storedMsg: StoredMessage
    }
  ): Promise<void> {
    const isOneBot = bot.platform === 'onebot'

    // 交付 1: 图文消息
    if (payload.modes.includes('text-and-image') && payload.textAvatarMessage) {
      await this.sendMessage(bot, targetId, isDirect, payload.textAvatarMessage)
      await new Promise(r => setTimeout(r, 120))
    }

    // 交付 2: Takumi WASM 渲染大图
    if (payload.modes.includes('takumi') && payload.takumiMessage) {
      await this.sendMessage(bot, targetId, isDirect, payload.takumiMessage)
      await new Promise(r => setTimeout(r, 120))
    }

    // 交付 3: 合并转发卡片 (OneBot 采用 forward 节点，非 OneBot 降级为图文引用)
    if (payload.modes.includes('forward')) {
      if (isOneBot) {
        const forwardMsg = h('message', { forward: true }, [
          h('message', { userId: payload.storedMsg.userId, nickname: payload.storedMsg.username }, payload.rawElements)
        ])
        await this.sendMessage(bot, targetId, isDirect, forwardMsg)
      } else {
        const quoteMsg: h[] = [
          h.text(`📝 [${payload.storedMsg.username}] 原撤回内容：\n`),
          ...payload.rawElements,
        ]
        await this.sendMessage(bot, targetId, isDirect, quoteMsg)
      }
      await new Promise(r => setTimeout(r, 120))
    }
  }

  /**
   * 底层消息下发封装
   */
  private async sendMessage(bot: Bot, targetId: string, isDirect: boolean, content: h | h[]): Promise<void> {
    if (isDirect) {
      if (typeof bot.createDirectChannel === 'function') {
        const channel = await bot.createDirectChannel(targetId)
        await bot.sendMessage(channel.id, content)
      } else if (typeof bot.sendPrivateMessage === 'function') {
        await bot.sendPrivateMessage(targetId, content)
      } else {
        await bot.sendMessage(targetId, content)
      }
    } else {
      await bot.sendMessage(targetId, content)
    }
  }
}
