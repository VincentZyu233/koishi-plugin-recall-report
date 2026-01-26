import { Schema } from 'koishi'

/** 群组配置 */
export interface GroupConfig {
  enabled: boolean
  channelId: string
  sendToMaster: boolean
  sendToGroup: boolean
}

/** 主人账号配置 */
export interface MasterAccount {
  platform: string
  userId: string
  enabled: boolean
}

/** 插件配置 */
export interface Config {
  /** 主人账号列表 */
  masterAccounts: MasterAccount[]
  /** 群组配置 */
  groupConfigs: GroupConfig[]
  /** 消息保存时长（秒） */
  messageSaveDuration: number
  /** 最大消息存储数量 */
  maxStoredMessages: number
}

/** 配置 Schema */
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    masterAccounts: Schema.array(Schema.object({
      platform: Schema.string()
        .description('平台名称，如 onebot')
        .default('onebot')
        .required(),
      userId: Schema.string()
        .description('用户ID')
        .required(),
      enabled: Schema.boolean()
        .description('是否启用')
        .default(true),
    }))
      .role('table')
      .default([{platform: 'onebot', userId: '1830540513', enabled: true}])
      .description('主人账号列表'),
  }).description('👑 主人账号配置'),

  Schema.object({
    groupConfigs: Schema.array(Schema.object({
      enabled: Schema.boolean()
        .description('是否启用本群撤回监听')
        .default(true),
      channelId: Schema.string()
        .description('群号（OneBot channelId）')
        .required(),
      sendToMaster: Schema.boolean()
        .description('是否发送到主人账号')
        .default(true),
      sendToGroup: Schema.boolean()
        .description('是否直接发送到群里')
        .default(true),
    }))
      .role('table')
      .default([{enabled: true, channelId: '259248174', sendToMaster: true, sendToGroup: true}])
      .description('群组配置列表'),
  }).description('📋 群组配置'),

  Schema.object({
    messageSaveDuration: Schema.number()
      .description('消息保存时长（秒）')
      .default(3600)
      .min(60)
      .max(86400),
    maxStoredMessages: Schema.number()
      .description('最大消息存储数量（超过后删除最旧的消息）')
      .default(999)
      .min(100)
      .max(10000),
  }).description('⚙️ 其他设置'),
])

/** 存储的消息数据 */
export interface StoredMessage {
  messageId: string
  channelId: string
  userId: string
  username: string
  content: string
  elements: any[]
  timestamp: number
}
