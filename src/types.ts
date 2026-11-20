import { h, Schema } from 'koishi'

/** 群组/频道监听配置 */
export interface GroupConfig {
  /** 是否启用本群撤回监听 */
  enabled: boolean
  /** 目标平台名称（如 onebot, discord, kook），留空则通配任意接入平台 */
  platform?: string
  /** 频道/群号 ID */
  channelId: string
  /** 是否发送到主人账号 */
  sendToMaster: boolean
  /** 是否直接发送到群里 */
  sendToGroup: boolean
}

/** 主人账号配置 */
export interface MasterAccount {
  /** 接收消息的平台名称，如 onebot, discord, kook */
  platform: string
  /** 主人用户 ID */
  userId: string
  /** 是否启用 */
  enabled: boolean
}

/** 插件配置结构 */
export interface Config {
  /** 主人账号列表 */
  masterAccounts: MasterAccount[]
  /** 群组配置 */
  groupConfigs: GroupConfig[]
  /** 消息保存时长（秒） */
  messageSaveDuration: number
  /** 最大消息存储数量 */
  maxStoredMessages: number
  /** 是否在支持合并转发的平台上优先使用合并转发 (如 OneBot/QQ) */
  preferForward: boolean
}

/** 配置 Schema */
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    masterAccounts: Schema.array(Schema.object({
      platform: Schema.string()
        .description('平台名称，如 onebot, discord, kook')
        .default('onebot'),
      userId: Schema.string()
        .description('主人用户ID')
        .default('1830540513'),
      enabled: Schema.boolean()
        .description('是否启用')
        .default(true),
    }))
      .role('table')
      .default([{ platform: 'onebot', userId: '1830540513', enabled: true }])
      .description('👑 主人账号列表（用于私聊接收撤回审计报告）'),
  }).description('👑 主人通知配置'),

  Schema.object({
    groupConfigs: Schema.array(Schema.object({
      enabled: Schema.boolean()
        .description('是否启用本群撤回监听')
        .default(true),
      platform: Schema.string()
        .description('平台名称（如 onebot、discord、kook），留空则通配所有接入平台')
        .default(''),
      channelId: Schema.string()
        .description('群号或频道 ID')
        .default('259248174'),
      sendToMaster: Schema.boolean()
        .description('是否发送给主人账号')
        .default(true),
      sendToGroup: Schema.boolean()
        .description('是否在原群/频道提醒')
        .default(true),
    }))
      .role('table')
      .default([{ enabled: true, platform: '', channelId: '259248174', sendToMaster: true, sendToGroup: true }])
      .description('📋 监听群组/频道列表'),
  }).description('📋 监听目标配置'),

  Schema.object({
    messageSaveDuration: Schema.number()
      .description('消息内存保存时长（秒，超时后自动清理释放内存）')
      .default(3600)
      .min(60)
      .max(86400),
    maxStoredMessages: Schema.number()
      .description('最大内存缓存消息条数（超出后遵循 LRU 删除最旧消息）')
      .default(1000)
      .min(100)
      .max(50000),
    preferForward: Schema.boolean()
      .description('在支持合并转发的平台上（如 OneBot/QQ）优先使用合并转发卡片')
      .default(true),
  }).description('⚙️ 缓存与渲染设置'),
])

/** 内存中存储的标准消息实体 */
export interface StoredMessage {
  /** 平台名称 */
  platform: string
  /** 频道/群号 */
  channelId: string
  /** 服务器/公域 Guild ID（若有） */
  guildId?: string
  /** 消息 ID */
  messageId: string
  /** 发送者用户 ID */
  userId: string
  /** 发送者昵称 */
  username: string
  /** 用户头像 URL */
  avatar?: string
  /** 纯文本备份内容 */
  content: string
  /** 原始 Satori 元素节点树 */
  elements: h[]
  /** 消息时间戳 */
  timestamp: number
}
