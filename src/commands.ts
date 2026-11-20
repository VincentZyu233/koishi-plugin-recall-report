import { Context } from 'koishi'
import { Config } from './types'
import { Utils } from './utils'
import { MessageStorage } from './storage'

/** 注册用户交互指令 */
export function registerCommands(
  ctx: Context,
  config: Config,
  utils: Utils,
  storage: MessageStorage
) {
  // ==================== 查看监听状态 ====================
  ctx.command('recall-status', '📊 查看全平台撤回监听状态')
    .action(() => {
      let result = '📊 撤回监听状态:\n'
      result += '━━━━━━━━━━━━━━━━\n'
      result += `💾 已缓存消息数: ${storage.getSize()} / ${config.maxStoredMessages}\n`
      result += `⏱️ 消息保留时长: ${config.messageSaveDuration} 秒\n`
      result += `📡 监听群组/频道: ${utils.getEnabledGroupCount()} 个\n`
      result += `👑 主人账号数: ${utils.getEnabledMasters().length} 个\n`
      result += '━━━━━━━━━━━━━━━━\n'

      const enabledGroups = config.groupConfigs.filter(g => g.enabled)
      if (enabledGroups.length > 0) {
        result += '\n📋 已启用的监听目标:\n'
        enabledGroups.forEach(g => {
          const platText = g.platform ? `[${g.platform}]` : '[全平台]'
          result += `  • ${platText} ${g.channelId}`
          const targets = []
          if (g.sendToMaster) targets.push('主人')
          if (g.sendToGroup) targets.push('群内')
          result += ` → ${targets.join(', ')}\n`
        })
      }

      return result
    })

  // ==================== 清空消息缓存 ====================
  ctx.command('recall-clear', '🧹 手动清空已缓存的消息')
    .action(() => {
      const count = storage.clear()
      return `✅ 已清空 ${count} 条消息缓存`
    })

  // ==================== 测试当前群组配置 ====================
  ctx.command('recall-test', '🧪 测试当前群组/频道的撤回监听配置')
    .action(async ({ session }) => {
      const groupConfig = utils.matchGroupConfig(session.platform, session.channelId)
      if (!groupConfig) {
        return `❌ 当前群组/频道未启用撤回监听 (平台: ${session.platform}, 频道: ${session.channelId})`
      }

      let result = '✅ 当前群组撤回监听已就绪\n'
      result += '━━━━━━━━━━━━━━━━\n'
      result += `平台: ${session.platform}\n`
      result += `群组/频道 ID: ${session.channelId}\n`
      result += `发送到主人: ${groupConfig.sendToMaster ? '是' : '否'}\n`
      result += `发送到群里: ${groupConfig.sendToGroup ? '是' : '否'}\n`
      result += `当前总缓存消息数: ${storage.getSize()}`

      return result
    })
}
