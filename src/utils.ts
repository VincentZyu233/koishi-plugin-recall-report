import { Context } from 'koishi'
import { Config, GroupConfig, MasterAccount } from './types'

/** 工具函数类 */
export class Utils {
  constructor(
    private ctx: Context,
    private config: Config
  ) {}

  /** 获取启用的主人账号 */
  getEnabledMasters(): MasterAccount[] {
    return this.config.masterAccounts.filter(m => m.enabled)
  }

  /** 获取群组配置 */
  getGroupConfig(channelId: string): GroupConfig | null {
    return this.config.groupConfigs.find(g => g.channelId === channelId && g.enabled) || null
  }

  /** 格式化时间 */
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

  /** 获取 QQ 头像 URL */
  getQQAvatarUrl(userId: string): string {
    return `https://q1.qlogo.cn/g?b=qq&nk=${userId}&s=640`
  }

  /** 获取群头像 URL */
  getGroupAvatarUrl(groupId: string): string {
    return `https://p.qlogo.cn/gh/${groupId}/${groupId}/100`
  }

  /** 获取启用的群组数量 */
  getEnabledGroupCount(): number {
    return this.config.groupConfigs.filter(g => g.enabled).length
  }
}
