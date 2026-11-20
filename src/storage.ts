import { Logger } from 'koishi'
import { StoredMessage } from './types'

const logger = new Logger('recall-report:storage')

/** 消息存储管理类 (复合平台命名空间 + LRU + 定时清理) */
export class MessageStorage {
  private messageStore = new Map<string, StoredMessage>()
  private messageOrder: string[] = [] // 用于追踪插入顺序

  constructor(
    private messageSaveDuration: number,
    private maxStoredMessages: number
  ) {}

  /** 生成复合存储 Key */
  private getCompositeKey(platform: string, channelId: string, messageId: string): string {
    return `${platform}:${channelId}:${messageId}`
  }

  /** 保存消息 */
  saveMessage(message: StoredMessage): void {
    const key = this.getCompositeKey(message.platform, message.channelId, message.messageId)

    // 如果消息已存在，先删除旧的顺序记录
    if (this.messageStore.has(key)) {
      const index = this.messageOrder.indexOf(key)
      if (index > -1) {
        this.messageOrder.splice(index, 1)
      }
    }

    // 保存消息
    this.messageStore.set(key, message)
    this.messageOrder.push(key)
    logger.debug(`[${message.platform}] 已保存消息: ${message.messageId}, 当前总数: ${this.messageStore.size}`)

    // LRU：如果超过最大数量，删除最旧的消息
    if (this.messageStore.size > this.maxStoredMessages) {
      const oldestKey = this.messageOrder.shift()
      if (oldestKey) {
        this.messageStore.delete(oldestKey)
        logger.info(`消息数量超过上限(${this.maxStoredMessages})，已自动置换最旧消息: ${oldestKey}`)
      }
    }

    // 设置定时过期释放内存
    setTimeout(() => {
      this.deleteMessageByKey(key)
    }, this.messageSaveDuration * 1000)
  }

  /** 获取消息（精确三元组查找，未传 platform/channelId 时提供前缀降级） */
  getMessage(platform: string, channelId: string, messageId: string): StoredMessage | null {
    const key = this.getCompositeKey(platform, channelId, messageId)
    const exact = this.messageStore.get(key)
    if (exact) return exact

    // 容错降级：如果 channelId 或 platform 出现轻微偏差，按 messageId 检索
    for (const [k, msg] of this.messageStore.entries()) {
      if (msg.messageId === messageId) {
        return msg
      }
    }
    return null
  }

  /** 通过 Key 删除消息 */
  private deleteMessageByKey(key: string): void {
    if (this.messageStore.delete(key)) {
      const index = this.messageOrder.indexOf(key)
      if (index > -1) {
        this.messageOrder.splice(index, 1)
      }
      logger.debug(`已清理过期消息缓存: ${key}`)
    }
  }

  /** 删除消息 */
  deleteMessage(platform: string, channelId: string, messageId: string): void {
    const key = this.getCompositeKey(platform, channelId, messageId)
    this.deleteMessageByKey(key)

    // 兜底清理其他可能的 key
    for (const [k, msg] of this.messageStore.entries()) {
      if (msg.messageId === messageId) {
        this.deleteMessageByKey(k)
      }
    }
  }

  /** 清空所有消息 */
  clear(): number {
    const count = this.messageStore.size
    this.messageStore.clear()
    this.messageOrder = []
    logger.info(`已清空 ${count} 条消息缓存`)
    return count
  }

  /** 获取已保存的消息数量 */
  getSize(): number {
    return this.messageStore.size
  }

  /** 检查消息是否存在 */
  hasMessage(platform: string, channelId: string, messageId: string): boolean {
    return this.getMessage(platform, channelId, messageId) !== null
  }
}
