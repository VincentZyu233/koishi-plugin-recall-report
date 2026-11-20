import { Bot, Context, h, Logger, Session } from 'koishi'
import { Config, GroupConfig, StoredMessage } from '../types'
import { Utils } from '../utils'
import { renderTextAndImage } from './text-and-image'
import { renderForward } from './forward'
import { renderTakumiCard } from './takumi'

export * from './text-and-image'
export * from './forward'
export * from './takumi'

const logger = new Logger('recall-report:renderer')

/**
 * 跨平台多交付形式自适应渲染与分发引擎
 */
export class RecallRenderer {
  constructor(
    private ctx: Context,
    private config: Config,
    private utils: Utils
  ) {}

  /**
   * 调度并分发撤回报告（多选模式：勾选几种就发送几条独立消息）
   */
  async dispatchRecallReport(session: Session, storedMsg: StoredMessage, groupConfig: GroupConfig): Promise<void> {
    const modes = Array.isArray(this.config.reportModes) && this.config.reportModes.length > 0
      ? this.config.reportModes
      : ['text-and-image', 'forward', 'takumi']

    logger.info(`[${storedMsg.platform}] 收到 ${storedMsg.username}(${storedMsg.userId}) 消息撤回，准备执行交付模式: ${modes.join(', ')}`)

    const recallTimeStr = this.utils.formatTime(session.timestamp)
    const originalTimeStr = this.utils.formatTime(storedMsg.timestamp)

    // 1. 构建图文消息 (若勾选 text-and-image)
    let textAvatarMessage: h[] | null = null
    if (modes.includes('text-and-image')) {
      textAvatarMessage = renderTextAndImage(session, storedMsg, this.utils, {
        recallTimeStr,
        originalTimeStr,
      })
    }

    // 2. 预生成 Takumi 卡片大图 (若勾选 takumi)
    let takumiMessage: h[] | null = null
    if (modes.includes('takumi')) {
      try {
        const pngBuffer = await renderTakumiCard(this.ctx, storedMsg, {
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

    // 3. 构建原始元素节点树
    const rawElements = (storedMsg.elements && storedMsg.elements.length > 0)
      ? storedMsg.elements
      : [h.text(storedMsg.content || '')]

    // 4. 执行发送到主人账号 (私聊推送：向所有平台匹配的 Bot 实例分发)
    if (groupConfig.sendToMaster) {
      const masters = this.utils.getEnabledMasters()
      for (const master of masters) {
        const candidateBots = this.ctx.bots.filter(b => b.platform === master.platform)
        if (candidateBots.length === 0) {
          logger.warn(`未找到接收平台 [${master.platform}] 的任何 Bot 实例，跳过向主人上报`)
          continue
        }

        for (const targetBot of candidateBots) {
          try {
            logger.info(`尝试通过 Bot [${targetBot.selfId}] 向主人 [${master.platform}:${master.userId}] 投递撤回报告...`)
            await this.sendDeliveries(targetBot, master.userId, true, {
              modes,
              textAvatarMessage,
              takumiMessage,
              rawElements,
              storedMsg,
            })
            logger.info(`已成功通过 Bot [${targetBot.selfId}] 向主人 [${master.platform}:${master.userId}] 投递撤回报告 (共 ${modes.length} 条消息)`)
          } catch (err) {
            logger.warn(`通过 Bot [${targetBot.selfId}] 发送撤回报告失败:`, err)
          }
        }
      }
    }

    // 5. 执行发送到原群/频道 (仅在 sendToGroup 为 true 时执行)
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
   * 按勾选的交付模式逐条发送消息实体
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
    const isQuoteForwardActive = Boolean(this.config.quoteForward)
      && payload.modes.includes('forward')
      && payload.modes.length >= 2

    if (isQuoteForwardActive) {
      // 激活引用转发模式：优先发送 forward 卡片，获取消息 ID，后续消息携带 h.quote 引用该卡片
      let forwardMsgId: string | null = null
      try {
        const forwardMsg = renderForward(bot, payload.storedMsg, payload.rawElements)
        const forwardIds = await this.sendMessage(bot, targetId, isDirect, forwardMsg)
        if (Array.isArray(forwardIds) && forwardIds.length > 0) {
          forwardMsgId = forwardIds[0]
        }
        await new Promise(r => setTimeout(r, 150))
      } catch (err) {
        logger.warn(`优先发送 forward 消息失败，后续降级为普通无引用发送:`, err)
      }

      // 后续 1: 图文消息 (若勾选)
      if (payload.modes.includes('text-and-image') && payload.textAvatarMessage) {
        const toSend = forwardMsgId
          ? [h.quote(forwardMsgId), ...payload.textAvatarMessage]
          : payload.textAvatarMessage
        await this.sendMessage(bot, targetId, isDirect, toSend)
        await new Promise(r => setTimeout(r, 120))
      }

      // 后续 2: Takumi WASM 渲染大图 (若勾选)
      if (payload.modes.includes('takumi') && payload.takumiMessage) {
        const toSend = forwardMsgId
          ? [h.quote(forwardMsgId), ...payload.takumiMessage]
          : payload.takumiMessage
        await this.sendMessage(bot, targetId, isDirect, toSend)
        await new Promise(r => setTimeout(r, 120))
      }
    } else {
      // 常规平级模式：按图文 -> Takumi -> 合并转发顺序发送
      if (payload.modes.includes('text-and-image') && payload.textAvatarMessage) {
        await this.sendMessage(bot, targetId, isDirect, payload.textAvatarMessage)
        await new Promise(r => setTimeout(r, 120))
      }

      if (payload.modes.includes('takumi') && payload.takumiMessage) {
        await this.sendMessage(bot, targetId, isDirect, payload.takumiMessage)
        await new Promise(r => setTimeout(r, 120))
      }

      if (payload.modes.includes('forward')) {
        const forwardMsg = renderForward(bot, payload.storedMsg, payload.rawElements)
        await this.sendMessage(bot, targetId, isDirect, forwardMsg)
        await new Promise(r => setTimeout(r, 120))
      }
    }
  }

  /**
   * 底层消息下发封装，返回发送成功后的消息 ID 数组
   */
  private async sendMessage(bot: Bot, targetId: string, isDirect: boolean, content: h | h[]): Promise<string[]> {
    if (isDirect) {
      if (typeof bot.createDirectChannel === 'function') {
        const channel = await bot.createDirectChannel(targetId)
        return await bot.sendMessage(channel.id, content)
      } else if (typeof bot.sendPrivateMessage === 'function') {
        const res = await (bot as any).sendPrivateMessage(targetId, content)
        return Array.isArray(res) ? res : res ? [res] : []
      } else {
        return await bot.sendMessage(targetId, content)
      }
    } else {
      return await bot.sendMessage(targetId, content)
    }
  }
}
