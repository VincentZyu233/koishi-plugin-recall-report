import { h, Schema } from 'koishi'

/** 撤回报告交付形式 */
export type ReportMode = 'text-and-image' | 'forward' | 'takumi'

/** 群组/频道监听配置 */
export interface GroupConfig {
  /** 是否启用本群撤回监听 */
  enabled: boolean
  /** 目标平台名称（如 onebot、discord、kook），留空则通配任意接入平台 */
  platform?: string
  /** 频道/群号 ID */
  channelId: string
  /** 是否发送到主人账号 */
  sendToMaster: boolean
  /** 是否直接发送到群里 (默认 false 关闭，避免打扰群内) */
  sendToGroup: boolean
}

/** 主人账号配置 */
export interface MasterAccount {
  /** 接收消息的平台名称（如 onebot、discord、kook） */
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
  /** 报告消息形式多选列表 (勾选几项就发送几条消息，最多 3 条) */
  reportModes: ReportMode[]
  /** Takumi 渲染卡片宽度 */
  takumiWidth: number
  /** Takumi 卡片是否采用深色模式 */
  takumiDarkMode: boolean
  /** Takumi 自定义中文字体路径 */
  takumiFontPath?: string
}

/** 配置 Schema */
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    masterAccounts: Schema.array(Schema.object({
      platform: Schema.string()
        .description('平台名称（如 onebot、discord、kook）')
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
        .default('1085190201'),
      sendToMaster: Schema.boolean()
        .description('是否发送给主人账号')
        .default(true),
      sendToGroup: Schema.boolean()
        .description('是否在原群/频道提醒 (默认关闭)')
        .default(false),
    }))
      .role('table')
      .default([{ enabled: true, platform: '', channelId: '1085190201', sendToMaster: true, sendToGroup: false }])
      .description('📋 监听群组/频道列表'),
  }).description('📋 监听目标配置'),

  Schema.object({
    reportModes: Schema.array(Schema.union([
      Schema.const('text-and-image' as const).description('🖼️【text-and-image】图文模式：双头像 + 结构化文字信息'),
      Schema.const('forward' as const).description('📑【forward】合并转发：QQ 合并转发卡片 / 其它平台引用文本'),
      Schema.const('takumi' as const).description('🦀【takumi】Takumi 出图：极速 WASM 渲染精美卡片大图'),
    ])).role('checkbox')
      .default(['text-and-image', 'forward', 'takumi'])
      .description('📢 报告消息形式（多选：勾选几个就发送几条独立消息，最多 3 条）'),

    takumiWidth: Schema.number()
      .default(640)
      .min(400)
      .max(1200)
      .description('📐 Takumi 渲染卡片宽度 (像素)'),

    takumiDarkMode: Schema.boolean()
      .default(false)
      .description('🌙 Takumi 卡片是否采用深色/暗黑主题'),

    takumiFontPath: Schema.string()
      .default('')
      .description('🔤 Takumi 自定义字体路径；留空时自动下载并使用 LXGW 文楷'),
  }).description('⚙️ 交付形式与渲染引擎设置'),

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
  }).description('💾 内存缓存管理设置'),
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
