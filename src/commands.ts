import { Context } from 'koishi'
import { Config } from './types'
import { Utils } from './utils'
import { MessageStorage } from './storage'

/** 注册命令 */
export function registerCommands(
  ctx: Context,
  config: Config,
  utils: Utils,
  storage: MessageStorage
) {
  // ==================== 查看状态命令 ====================
  ctx.command('recall-status', '查看撤回监听状态')
    .action(() => {
      let result = '📊 撤回监听状态:\n'
      result += '━━━━━━━━━━━━━━━━\n'
      result += `� 已保存消息数: ${storage.getSize()} / ${config.maxStoredMessages}\n`
      result += `⏱️ 消息保存时长: ${config.messageSaveDuration} 秒\n`
      result += `📡 监听群组数: ${utils.getEnabledGroupCount()}\n`
      result += `👑 主人账号数: ${utils.getEnabledMasters().length}\n`
      result += '━━━━━━━━━━━━━━━━\n'
      
      const enabledGroups = config.groupConfigs.filter(g => g.enabled)
      if (enabledGroups.length > 0) {
        result += '\n已启用的群组:\n'
        enabledGroups.forEach(g => {
          result += `  • ${g.channelId}`
          const targets = []
          if (g.sendToMaster) targets.push('主人')
          if (g.sendToGroup) targets.push('群内')
          result += ` → ${targets.join(', ')}\n`
        })
      }

      return result
    })

  // ==================== 清空缓存命令 ====================
  ctx.command('recall-clear', '清空消息缓存')
    .action(() => {
      const count = storage.clear()
      return `✅ 已清空 ${count} 条消息缓存`
    })

  // ==================== 测试命令 ====================
  ctx.command('recall-test', '测试撤回通知功能')
    .action(async ({ session }) => {
      const groupConfig = utils.getGroupConfig(session.channelId)
      if (!groupConfig) {
        return '❌ 当前群组未启用撤回监听'
      }

      let result = '✅ 当前群组撤回监听已启用\n'
      result += '━━━━━━━━━━━━━━━━\n'
      result += `群号: ${session.channelId}\n`
      result += `发送到主人: ${groupConfig.sendToMaster ? '是' : '否'}\n`
      result += `发送到群里: ${groupConfig.sendToGroup ? '是' : '否'}\n`
      result += `当前缓存消息数: ${storage.getSize()}`

      return result
    })
}
