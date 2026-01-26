import { Logger } from 'koishi'
import { StoredMessage } from './types'

const logger = new Logger('onebot-recall-report:storage')

/** 消息存储管理类 */
export class MessageStorage {
  private messageStore = new Map<string, StoredMessage>()
  private messageOrder: string[] = [] // 用于追踪插入顺序

  constructor(
    private messageSaveDuration: number,
    private maxStoredMessages: number
  ) {}

  /** 保存消息 */
  saveMessage(message: StoredMessage): void {
    // 如果消息已存在，先删除旧的顺序记录
    if (this.messageStore.has(message.messageId)) {
      const index = this.messageOrder.indexOf(message.messageId)
      if (index > -1) {
        this.messageOrder.splice(index, 1)
      }
    }

    // 保存消息
    this.messageStore.set(message.messageId, message)
    this.messageOrder.push(message.messageId)
    logger.debug(`已保存消息: ${message.messageId}, 当前总数: ${this.messageStore.size}`)

    // LRU：如果超过最大数量，删除最旧的消息
    if (this.messageStore.size > this.maxStoredMessages) {
      const oldestId = this.messageOrder.shift()
      if (oldestId) {
        this.messageStore.delete(oldestId)
        logger.info(`消息数量超过限制(${this.maxStoredMessages})，已删除最旧消息: ${oldestId}`)
      }
    }

    // 设置定时清理
    setTimeout(() => {
      this.deleteMessage(message.messageId)
    }, this.messageSaveDuration * 1000)
  }

  /** 获取消息 */
  getMessage(messageId: string): StoredMessage | null {
    return this.messageStore.get(messageId) || null
  }

  /** 删除消息 */
  deleteMessage(messageId: string): void {
    if (this.messageStore.delete(messageId)) {
      // 同时从顺序数组中删除
      const index = this.messageOrder.indexOf(messageId)
      if (index > -1) {
        this.messageOrder.splice(index, 1)
      }
      logger.debug(`已清理消息: ${messageId}`)
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
  hasMessage(messageId: string): boolean {
    return this.messageStore.has(messageId)
  }
}
