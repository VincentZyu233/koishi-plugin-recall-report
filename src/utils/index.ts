export * from './font'
import { Context, Session } from 'koishi'
import { Config, GroupConfig, MasterAccount, StoredMessage } from '../types'

/** 工具函数类 */
export class Utils {
  constructor(
    private ctx: Context,
    private config: Config
  ) {}

  /** 获取启用的主人账号列表 */
  getEnabledMasters(): MasterAccount[] {
    return this.config.masterAccounts.filter(m => m.enabled)
  }

  /** 获取匹配的群组配置（支持平台 + 频道 ID 匹配，或平台通配） */
  matchGroupConfig(platform: string, channelId: string): GroupConfig | null {
    return this.config.groupConfigs.find(g => {
      if (!g.enabled) return false
      if (g.channelId !== channelId) return false
      if (g.platform && g.platform.trim().length > 0) {
        return g.platform.trim().toLowerCase() === platform.toLowerCase()
      }
      return true
    }) || null
  }

  /** 获取群组配置（兼容旧版单 channelId 查找） */
  getGroupConfig(channelId: string, platform?: string): GroupConfig | null {
    if (platform) return this.matchGroupConfig(platform, channelId)
    return this.config.groupConfigs.find(g => g.channelId === channelId && g.enabled) || null
  }

  /** 格式化时间戳 */
  formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  /**
   * 解析用户头像：
   * 1. 优先提取 Satori Universal 标准头像 (session.event.user.avatar / session.author.avatar / stored.avatar)
   * 2. 若无且属于 OneBot 平台，平滑回退至腾讯头像接口
   */
  resolveUserAvatar(session?: Session, stored?: StoredMessage): string | undefined {
    const standard = session?.event?.user?.avatar || session?.author?.avatar || stored?.avatar
    if (standard && typeof standard === 'string' && standard.trim().length > 0) {
      return standard
    }

    const platform = (session?.platform || stored?.platform || '').toLowerCase()
    const userId = session?.userId || stored?.userId
    if (platform === 'onebot' && userId) {
      return `https://q1.qlogo.cn/g?b=qq&nk=${userId}&s=640`
    }

    return undefined
  }

  /**
   * 解析群组/频道头像：
   * 1. 优先提取 session.event.guild.avatar
   * 2. 若属于 OneBot 平台，回退至群头像接口
   */
  resolveGroupAvatar(session: Session, stored?: StoredMessage): string | undefined {
    if (session.event?.guild?.avatar) {
      return session.event.guild.avatar
    }

    const platform = (session.platform || stored?.platform || '').toLowerCase()
    const channelId = session.channelId || stored?.channelId
    if (platform === 'onebot' && channelId) {
      return `https://p.qlogo.cn/gh/${channelId}/${channelId}/100`
    }

    return undefined
  }

  /** 获取启用的群组总数 */
  getEnabledGroupCount(): number {
    return this.config.groupConfigs.filter(g => g.enabled).length
  }
}
