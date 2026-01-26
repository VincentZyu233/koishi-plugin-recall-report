import { Context, Logger } from 'koishi'
import { Config } from './types'
import { Utils } from './utils'
import { MessageStorage } from './storage'
import { registerEvents } from './events'
import { registerCommands } from './commands'

export const name = 'onebot-recall-report'

export { Config } from './types'

export const usage = `
## 🎯 插件功能

监听 OneBot 群组中的消息撤回事件，并将撤回的消息转发给主人或群组。

## 📝 使用说明

1. 在「主人账号配置」中添加你的账号信息
2. 在「群组配置」中添加要监听的群组
3. 配置每个群组的转发目标（主人/群里）
4. 插件会自动监听并转发撤回的消息

## 🔧 可用命令

- \`recall-status\` - 查看撤回监听状态
- \`recall-clear\` - 清空消息缓存
- \`recall-test\` - 测试当前群组配置

## ⚠️ 注意事项

- 需要先安装 OneBot 适配器
- 消息会在内存中临时保存，重启后会丢失
- 建议设置合适的消息保存时长以节省内存
`

const logger = new Logger('onebot-recall-report')

export function apply(ctx: Context, config: Config) {
  logger.info('插件正在加载...')

  // 创建工具类
  const utils = new Utils(ctx, config)

  // 创建消息存储
  const storage = new MessageStorage(config.messageSaveDuration, config.maxStoredMessages)

  // 注册事件监听器
  registerEvents(ctx, config, utils, storage)

  // 注册命令
  registerCommands(ctx, config, utils, storage)

  logger.info('插件加载完成')
  logger.info(`当前监听 ${utils.getEnabledGroupCount()} 个群组`)
}
